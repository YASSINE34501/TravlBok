"use server";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { requireUser, requireOrganizationAccess, ROLE_GROUPS } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import {
  hotelBookingSchema,
  carBookingSchema,
  type HotelBookingInput,
  type CarBookingInput,
} from "@/lib/validation/reservation";
import { calculateHotelPriceBreakdown, calculateCarPriceBreakdown, enumerateNights } from "./pricing";
import { resolveCoupon, getCommissionRate } from "./coupons";
import { checkOrganizationLimit } from "@/domains/subscriptions/limits";
import { createBookingPaymentAndInvoice } from "@/domains/payments/booking-payment";
import { recordAffiliateConversion } from "@/domains/affiliates/conversion";
import { handleReservationStatusChangeForCommission } from "@/domains/affiliates/commission-lifecycle";
import { notifyChannelsOfCancellation } from "@/domains/channel-manager/sync";
import { getStayDynamicPricing, toNightlyPriceOverrideMap } from "@/domains/dynamic-pricing/resolver";
import { logDynamicPricesForBooking } from "@/domains/dynamic-pricing/log";
import { getStayOccupancy } from "@/domains/dynamic-pricing/occupancy";
import { notifyUser, notifyOrganizationOwners } from "@/domains/notifications/service";

/** "Low inventory" — notifies the partner whenever a booking leaves 20% or less of a room type's stock remaining for that stay window. */
const LOW_INVENTORY_THRESHOLD_RATIO = 0.2;

async function notifyLowInventoryIfNeeded(
  organizationId: string,
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
  availableQuantity: number
): Promise<void> {
  if (availableQuantity <= 0) return;
  const { remainingInventory } = await getStayOccupancy(roomTypeId, checkIn, checkOut, availableQuantity);
  if (remainingInventory / availableQuantity > LOW_INVENTORY_THRESHOLD_RATIO) return;

  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    select: { name: true, hotel: { select: { name: true } } },
  });
  if (!roomType) return;

  await notifyOrganizationOwners(organizationId, {
    type: "low_inventory",
    title: "Low room inventory",
    message: `${roomType.name} at ${roomType.hotel.name} has only ${remainingInventory} unit(s) left for the requested dates.`,
    metadata: { roomTypeId, remainingInventory },
    channels: ["IN_APP", "EMAIL"],
  });
}

type BookingResult =
  | { success: true; reservationId: string; bookingReference: string }
  | { success: false; error: string };

function generateBookingReference(): string {
  return `TB${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function createHotelReservationAction(
  locale: string,
  input: HotelBookingInput
): Promise<BookingResult> {
  const user = await requireUser(locale);

  const parsed = hotelBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "invalidInput" };
  }
  const data = parsed.data;
  const checkIn = new Date(data.checkInDate);
  const checkOut = new Date(data.checkOutDate);

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const roomType = await tx.roomType.findFirst({
          where: { id: data.roomTypeId, isActive: true, deletedAt: null },
          include: {
            hotel: true,
            seasonalPrices: true,
            availabilityOverrides: {
              where: { date: { gte: checkIn, lt: checkOut } },
            },
          },
        });
        if (!roomType || roomType.hotel.status !== "PUBLISHED") {
          throw new BookingError("notFound");
        }

        const bookingLimit = await checkOrganizationLimit(
          roomType.hotel.organizationId,
          "MONTHLY_BOOKINGS"
        );
        if (!bookingLimit.allowed) {
          throw new BookingError("organizationBookingLimitReached");
        }

        const isClosed = roomType.availabilityOverrides.some((o) => o.closedForBooking);
        if (isClosed) {
          throw new BookingError("datesUnavailable");
        }

        const nights = Math.round(
          (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (nights < roomType.minStay || (roomType.maxStay && nights > roomType.maxStay)) {
          throw new BookingError("stayLengthInvalid");
        }

        const overlapping = await tx.reservation.findMany({
          where: {
            status: { in: ["PENDING", "CONFIRMED"] },
            checkInDate: { lt: checkOut },
            checkOutDate: { gt: checkIn },
            roomItems: { some: { roomTypeId: data.roomTypeId } },
          },
          include: { roomItems: { where: { roomTypeId: data.roomTypeId } } },
        });
        const bookedQuantity = overlapping.reduce(
          (sum, reservation) =>
            sum + reservation.roomItems.reduce((s, item) => s + item.quantity, 0),
          0
        );
        if (bookedQuantity + data.quantity > roomType.availableQuantity) {
          throw new BookingError("notEnoughAvailability");
        }

        const commissionRate = await getCommissionRate(roomType.hotel.organizationId, "HOTEL");

        const dynamicPricing = await getStayDynamicPricing(
          roomType.hotel.organizationId,
          roomType,
          checkIn,
          checkOut
        );
        const nightlyPriceOverrides = toNightlyPriceOverrideMap(dynamicPricing);

        const preDiscountBreakdown = calculateHotelPriceBreakdown({
          checkIn,
          checkOut,
          quantity: data.quantity,
          basePrice: Number(roomType.basePrice),
          weekendPrice: roomType.weekendPrice ? Number(roomType.weekendPrice) : null,
          taxRatePercent: Number(roomType.taxRatePercent),
          cleaningFee: Number(roomType.cleaningFee),
          seasonalPrices: roomType.seasonalPrices.map((s) => ({
            startDate: s.startDate,
            endDate: s.endDate,
            price: Number(s.price),
            weekendPrice: s.weekendPrice ? Number(s.weekendPrice) : null,
          })),
          overrides: roomType.availabilityOverrides.map((o) => ({
            date: o.date,
            priceOverride: o.priceOverride ? Number(o.priceOverride) : null,
            closedForBooking: o.closedForBooking,
          })),
          commissionRate,
          discountAmount: 0,
          nightlyPriceOverrides,
        });

        const coupon = await resolveCoupon(
          data.couponCode || undefined,
          "HOTEL",
          roomType.hotel.organizationId,
          preDiscountBreakdown.basePriceAmount +
            preDiscountBreakdown.taxAmount +
            preDiscountBreakdown.feeAmount
        );

        const breakdown = calculateHotelPriceBreakdown({
          checkIn,
          checkOut,
          quantity: data.quantity,
          basePrice: Number(roomType.basePrice),
          weekendPrice: roomType.weekendPrice ? Number(roomType.weekendPrice) : null,
          taxRatePercent: Number(roomType.taxRatePercent),
          cleaningFee: Number(roomType.cleaningFee),
          seasonalPrices: roomType.seasonalPrices.map((s) => ({
            startDate: s.startDate,
            endDate: s.endDate,
            price: Number(s.price),
            weekendPrice: s.weekendPrice ? Number(s.weekendPrice) : null,
          })),
          overrides: roomType.availabilityOverrides.map((o) => ({
            date: o.date,
            priceOverride: o.priceOverride ? Number(o.priceOverride) : null,
            closedForBooking: o.closedForBooking,
          })),
          commissionRate,
          discountAmount: coupon.discountAmount,
          nightlyPriceOverrides,
        });

        const bookingReference = generateBookingReference();
        const status = roomType.instantBooking ? "CONFIRMED" : "PENDING";

        const reservation = await tx.reservation.create({
          data: {
            bookingReference,
            type: "HOTEL",
            status,
            customerUserId: user.id,
            organizationId: roomType.hotel.organizationId,
            currency: roomType.currency,
            basePriceAmount: breakdown.basePriceAmount,
            taxAmount: breakdown.taxAmount,
            feeAmount: breakdown.feeAmount,
            discountAmount: breakdown.discountAmount,
            commissionAmount: breakdown.commissionAmount,
            totalAmount: breakdown.totalAmount,
            paymentMethod: data.paymentProvider === "CASH_AT_PROPERTY" ? "PAY_AT_PROPERTY" : "MANUAL",
            couponId: coupon.couponId,
            couponCodeSnapshot: coupon.couponId ? data.couponCode : null,
            guestFirstName: data.guestFirstName,
            guestLastName: data.guestLastName,
            guestEmail: data.guestEmail,
            guestPhone: data.guestPhone || null,
            specialRequests: data.specialRequests || null,
            hotelId: roomType.hotel.id,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            confirmedAt: status === "CONFIRMED" ? new Date() : null,
            hotelLink: { create: { hotelId: roomType.hotel.id } },
            roomItems: {
              create: {
                roomTypeId: roomType.id,
                quantity: data.quantity,
                nights: breakdown.nights,
                unitPrice: Number(roomType.basePrice),
                subtotal: breakdown.basePriceAmount,
              },
            },
          },
        });

        if (coupon.couponId) {
          await tx.coupon.update({
            where: { id: coupon.couponId },
            data: { usageCount: { increment: 1 } },
          });
        }

        await tx.notification.create({
          data: {
            userId: user.id,
            type: status === "CONFIRMED" ? "booking_confirmed" : "booking_pending",
            title: status === "CONFIRMED" ? "Booking confirmed" : "Booking received",
            message:
              status === "CONFIRMED"
                ? `Your booking ${bookingReference} at ${roomType.hotel.name} is confirmed.`
                : `Your booking ${bookingReference} at ${roomType.hotel.name} is pending confirmation from the property.`,
          },
        });

        await recordAffiliateConversion(tx, reservation);

        return {
          reservation,
          roomTypeId: roomType.id,
          availableQuantity: roomType.availableQuantity,
          dynamicPricing,
        };
      },
      { isolationLevel: "Serializable", timeout: 15_000 }
    );

    const { reservation, roomTypeId, availableQuantity, dynamicPricing } = result;

    await logAudit({
      actorUserId: user.id,
      organizationId: reservation.organizationId,
      action: "reservation.create",
      entityType: "Reservation",
      entityId: reservation.id,
    });

    await createBookingPaymentAndInvoice(reservation, data.paymentProvider);
    await logDynamicPricesForBooking(roomTypeId, enumerateNights(checkIn, checkOut), dynamicPricing);
    await notifyLowInventoryIfNeeded(reservation.organizationId, roomTypeId, checkIn, checkOut, availableQuantity);

    return {
      success: true,
      reservationId: reservation.id,
      bookingReference: reservation.bookingReference,
    };
  } catch (error) {
    if (error instanceof BookingError) {
      return { success: false, error: error.code };
    }
    console.error(error);
    return { success: false, error: "somethingWentWrong" };
  }
}

export async function createCarReservationAction(
  locale: string,
  input: CarBookingInput
): Promise<BookingResult> {
  const user = await requireUser(locale);

  const parsed = carBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "invalidInput" };
  }
  const data = parsed.data;
  const pickupAt = new Date(data.pickupAt);
  const returnAt = new Date(data.returnAt);

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const vehicle = await tx.vehicle.findFirst({
          where: { id: data.vehicleId, deletedAt: null },
        });
        if (!vehicle || vehicle.approvalStatus !== "PUBLISHED") {
          throw new BookingError("notFound");
        }
        if (vehicle.status === "MAINTENANCE" || vehicle.status === "INACTIVE") {
          throw new BookingError("datesUnavailable");
        }

        const bookingLimit = await checkOrganizationLimit(
          vehicle.organizationId,
          "MONTHLY_BOOKINGS"
        );
        if (!bookingLimit.allowed) {
          throw new BookingError("organizationBookingLimitReached");
        }

        const overlapping = await tx.reservation.count({
          where: {
            status: { in: ["PENDING", "CONFIRMED"] },
            pickupAt: { lt: returnAt },
            returnAt: { gt: pickupAt },
            carLink: { vehicleId: data.vehicleId },
          },
        });
        if (overlapping > 0) {
          throw new BookingError("notEnoughAvailability");
        }

        const commissionRate = await getCommissionRate(vehicle.organizationId, "CAR");

        const preDiscount = calculateCarPriceBreakdown({
          pickupAt,
          returnAt,
          pricePerDay: Number(vehicle.pricePerDay),
          commissionRate,
          discountAmount: 0,
        });

        const coupon = await resolveCoupon(
          data.couponCode || undefined,
          "CAR",
          vehicle.organizationId,
          preDiscount.basePriceAmount
        );

        const breakdown = calculateCarPriceBreakdown({
          pickupAt,
          returnAt,
          pricePerDay: Number(vehicle.pricePerDay),
          commissionRate,
          discountAmount: coupon.discountAmount,
        });

        const bookingReference = generateBookingReference();

        const reservation = await tx.reservation.create({
          data: {
            bookingReference,
            type: "CAR",
            status: "CONFIRMED",
            customerUserId: user.id,
            organizationId: vehicle.organizationId,
            currency: vehicle.currency,
            basePriceAmount: breakdown.basePriceAmount,
            taxAmount: breakdown.taxAmount,
            feeAmount: breakdown.feeAmount,
            discountAmount: breakdown.discountAmount,
            commissionAmount: breakdown.commissionAmount,
            totalAmount: breakdown.totalAmount,
            paymentMethod: data.paymentProvider === "CASH_AT_PROPERTY" ? "PAY_AT_PROPERTY" : "MANUAL",
            couponId: coupon.couponId,
            couponCodeSnapshot: coupon.couponId ? data.couponCode : null,
            guestFirstName: data.guestFirstName,
            guestLastName: data.guestLastName,
            guestEmail: data.guestEmail,
            guestPhone: data.guestPhone || null,
            specialRequests: data.specialRequests || null,
            vehicleId: vehicle.id,
            pickupAt,
            returnAt,
            pickupLocation: data.pickupLocation || null,
            dropoffLocation: data.dropoffLocation || null,
            driverOptionRequested: data.driverOptionRequested,
            gpsRequested: data.gpsRequested,
            childSeatRequested: data.childSeatRequested,
            airportDelivery: data.airportDelivery,
            confirmedAt: new Date(),
            carLink: { create: { vehicleId: vehicle.id } },
          },
        });

        if (coupon.couponId) {
          await tx.coupon.update({
            where: { id: coupon.couponId },
            data: { usageCount: { increment: 1 } },
          });
        }

        await tx.notification.create({
          data: {
            userId: user.id,
            type: "booking_confirmed",
            title: "Booking confirmed",
            message: `Your booking ${bookingReference} for ${vehicle.brand} ${vehicle.model} is confirmed.`,
          },
        });

        await recordAffiliateConversion(tx, reservation);

        return reservation;
      },
      { isolationLevel: "Serializable", timeout: 15_000 }
    );

    await logAudit({
      actorUserId: user.id,
      organizationId: result.organizationId,
      action: "reservation.create",
      entityType: "Reservation",
      entityId: result.id,
    });

    await createBookingPaymentAndInvoice(result, data.paymentProvider);

    return {
      success: true,
      reservationId: result.id,
      bookingReference: result.bookingReference,
    };
  } catch (error) {
    if (error instanceof BookingError) {
      return { success: false, error: error.code };
    }
    console.error(error);
    return { success: false, error: "somethingWentWrong" };
  }
}

export async function cancelReservationAction(
  locale: string,
  reservationId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser(locale);

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });
  if (!reservation) return { success: false, error: "notFound" };
  if (reservation.customerUserId !== user.id) {
    return { success: false, error: "unauthorized" };
  }
  if (reservation.status !== "PENDING" && reservation.status !== "CONFIRMED") {
    return { success: false, error: "cannotCancel" };
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledReason: reason || null,
      cancelledByUserId: user.id,
    },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId: reservation.organizationId,
    action: "reservation.cancel",
    entityType: "Reservation",
    entityId: reservationId,
  });

  await handleReservationStatusChangeForCommission(reservationId, "CANCELLED");
  await notifyChannelsOfCancellation(reservationId);
  await notifyOrganizationOwners(reservation.organizationId, {
    type: "booking_cancelled_by_customer",
    title: "Booking cancelled",
    message: `Booking ${reservation.bookingReference} was cancelled by the customer.`,
    metadata: { reservationId },
    channels: ["IN_APP", "EMAIL"],
  });

  return { success: true };
}

export async function updatePartnerReservationStatusAction(
  locale: string,
  organizationId: string,
  reservationId: string,
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW",
  internalNotes?: string
): Promise<{ success: boolean }> {
  const user = await requireOrganizationAccess(locale, organizationId, [
    ...ROLE_GROUPS.partnerOwners,
    ...ROLE_GROUPS.hotelStaff,
    ...ROLE_GROUPS.carRentalStaff,
  ]);

  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, organizationId },
  });
  if (!reservation) return { success: false };

  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status,
      internalNotes: internalNotes ?? reservation.internalNotes,
      ...(status === "CANCELLED" ? { cancelledAt: new Date() } : {}),
      ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
    },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: `reservation.status.${status.toLowerCase()}`,
    entityType: "Reservation",
    entityId: reservationId,
  });

  await handleReservationStatusChangeForCommission(reservationId, status);
  if (status === "CANCELLED") {
    await notifyChannelsOfCancellation(reservationId);
    await notifyUser({
      userId: reservation.customerUserId,
      type: "booking_cancelled_by_partner",
      title: "Booking cancelled",
      message: `Your booking ${reservation.bookingReference} was cancelled by the property.`,
      metadata: { reservationId },
      channels: ["IN_APP", "EMAIL"],
    });
  }

  return { success: true };
}

class BookingError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}
