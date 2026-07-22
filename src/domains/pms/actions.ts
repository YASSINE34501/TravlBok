"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { requireOrganizationAccess, ROLE_GROUPS } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { hasFeature, checkOrganizationLimit } from "@/domains/subscriptions/limits";
import {
  createBookingPaymentAndInvoice,
  createAdHocPaymentAndInvoice,
} from "@/domains/payments/booking-payment";

type ActionResult = { success: true } | { success: false; error: string };

const PMS_STAFF_ROLES = [...ROLE_GROUPS.partnerOwners, ...ROLE_GROUPS.hotelStaff];

async function requirePmsAccess(locale: string, organizationId: string) {
  const user = await requireOrganizationAccess(locale, organizationId, PMS_STAFF_ROLES);
  const enabled = await hasFeature(organizationId, "featurePms");
  if (!enabled) {
    throw new Error("PMS is not enabled on this organization's plan");
  }
  return user;
}

function generateBookingReference(): string {
  return `TB${randomBytes(4).toString("hex").toUpperCase()}`;
}

// ---- Room inventory ----

export async function generateRoomInventoryUnitsAction(
  locale: string,
  organizationId: string,
  hotelId: string,
  roomTypeId: string,
  count: number
): Promise<ActionResult> {
  const user = await requirePmsAccess(locale, organizationId);

  const roomType = await prisma.roomType.findFirst({
    where: { id: roomTypeId, hotelId },
  });
  if (!roomType) return { success: false, error: "notFound" };

  const existingCount = await prisma.roomInventory.count({ where: { roomTypeId } });

  const units = Array.from({ length: count }, (_, i) => ({
    roomTypeId,
    hotelId,
    unitNumber: `${roomType.name.slice(0, 3).toUpperCase()}-${existingCount + i + 1}`,
  }));

  await prisma.roomInventory.createMany({ data: units });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "pms.room_inventory.generate",
    entityType: "RoomType",
    entityId: roomTypeId,
    metadata: { count },
  });

  revalidatePath(`/${locale}/dashboard/pms`);
  return { success: true };
}

// ---- Check-in / Check-out ----

export async function checkInGuestAction(
  locale: string,
  organizationId: string,
  reservationId: string,
  input: { roomInventoryId: string; idDocumentRef?: string; depositAmount?: number; notes?: string }
): Promise<ActionResult> {
  const user = await requirePmsAccess(locale, organizationId);

  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, organizationId, type: "HOTEL" },
  });
  if (!reservation) return { success: false, error: "notFound" };

  const roomInventory = await prisma.roomInventory.findUnique({
    where: { id: input.roomInventoryId },
  });
  if (
    !roomInventory ||
    (roomInventory.operationalStatus !== "AVAILABLE" && roomInventory.operationalStatus !== "READY")
  ) {
    return { success: false, error: "roomNotAvailable" };
  }

  let guestProfile = await prisma.guestProfile.findFirst({
    where: { hotelId: roomInventory.hotelId, email: reservation.guestEmail },
  });
  if (!guestProfile) {
    guestProfile = await prisma.guestProfile.create({
      data: {
        organizationId,
        hotelId: roomInventory.hotelId,
        firstName: reservation.guestFirstName,
        lastName: reservation.guestLastName,
        email: reservation.guestEmail,
        phone: reservation.guestPhone,
      },
    });
  }

  await prisma.$transaction([
    prisma.checkIn.create({
      data: {
        reservationId,
        roomInventoryId: input.roomInventoryId,
        guestProfileId: guestProfile.id,
        idDocumentRef: input.idDocumentRef || null,
        depositAmount: input.depositAmount ?? null,
        depositCurrency: input.depositAmount ? reservation.currency : null,
        notes: input.notes || null,
        checkedInByUserId: user.id,
      },
    }),
    prisma.roomInventory.update({
      where: { id: input.roomInventoryId },
      data: { operationalStatus: "OCCUPIED" },
    }),
  ]);

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "pms.check_in",
    entityType: "Reservation",
    entityId: reservationId,
  });

  revalidatePath(`/${locale}/dashboard/pms`);
  return { success: true };
}

export async function checkOutGuestAction(
  locale: string,
  organizationId: string,
  checkInId: string,
  input: { extraChargesAmount?: number; discountAmount?: number; roomConditionNotes?: string }
): Promise<ActionResult> {
  const user = await requirePmsAccess(locale, organizationId);

  const checkIn = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    include: { reservation: true, roomInventory: true },
  });
  if (!checkIn || checkIn.reservation.organizationId !== organizationId) {
    return { success: false, error: "notFound" };
  }

  const extraCharges = input.extraChargesAmount ?? 0;
  const discount = input.discountAmount ?? 0;

  await prisma.$transaction([
    prisma.checkOut.create({
      data: {
        checkInId,
        extraChargesAmount: extraCharges,
        discountAmount: discount,
        roomConditionNotes: input.roomConditionNotes || null,
        checkedOutByUserId: user.id,
      },
    }),
    prisma.roomInventory.update({
      where: { id: checkIn.roomInventoryId },
      data: { operationalStatus: "DIRTY" },
    }),
    prisma.housekeepingTask.create({
      data: {
        roomInventoryId: checkIn.roomInventoryId,
        hotelId: checkIn.roomInventory.hotelId,
        type: "CLEANING",
        status: "PENDING",
        createdByUserId: user.id,
      },
    }),
    prisma.reservation.update({
      where: { id: checkIn.reservationId },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
  ]);

  if (extraCharges > 0) {
    await createAdHocPaymentAndInvoice(
      checkIn.reservation,
      extraCharges,
      `Extra charges for booking ${checkIn.reservation.bookingReference}`,
      "CASH_AT_PROPERTY"
    );
  }

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "pms.check_out",
    entityType: "CheckIn",
    entityId: checkInId,
  });

  revalidatePath(`/${locale}/dashboard/pms`);
  return { success: true };
}

// ---- Walk-in reservations ----

export async function createWalkInReservationAction(
  locale: string,
  organizationId: string,
  input: {
    hotelId: string;
    roomTypeId: string;
    checkInDate: string;
    checkOutDate: string;
    guestFirstName: string;
    guestLastName: string;
    guestEmail: string;
    guestPhone?: string;
  }
): Promise<{ success: true; reservationId: string } | { success: false; error: string }> {
  const user = await requirePmsAccess(locale, organizationId);

  const limitCheck = await checkOrganizationLimit(organizationId, "MONTHLY_BOOKINGS");
  if (!limitCheck.allowed) return { success: false, error: "planLimitReached" };

  const roomType = await prisma.roomType.findFirst({
    where: { id: input.roomTypeId, hotelId: input.hotelId },
  });
  if (!roomType) return { success: false, error: "notFound" };

  const checkIn = new Date(input.checkInDate);
  const checkOut = new Date(input.checkOutDate);
  const nights = Math.max(
    1,
    Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  );
  const basePriceAmount = Number(roomType.basePrice) * nights;
  const taxAmount = (basePriceAmount * Number(roomType.taxRatePercent)) / 100;
  const totalAmount = basePriceAmount + taxAmount + Number(roomType.cleaningFee);

  const reservation = await prisma.reservation.create({
    data: {
      bookingReference: generateBookingReference(),
      type: "HOTEL",
      status: "CONFIRMED",
      bookingSource: "WALK_IN",
      customerUserId: user.id,
      organizationId,
      currency: roomType.currency,
      basePriceAmount,
      taxAmount,
      feeAmount: roomType.cleaningFee,
      totalAmount,
      guestFirstName: input.guestFirstName,
      guestLastName: input.guestLastName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone || null,
      hotelId: input.hotelId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      confirmedAt: new Date(),
      hotelLink: { create: { hotelId: input.hotelId } },
      roomItems: {
        create: {
          roomTypeId: input.roomTypeId,
          quantity: 1,
          nights,
          unitPrice: Number(roomType.basePrice),
          subtotal: basePriceAmount,
        },
      },
    },
  });

  await createBookingPaymentAndInvoice(reservation, "CASH_AT_PROPERTY");

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "pms.walk_in.create",
    entityType: "Reservation",
    entityId: reservation.id,
  });

  revalidatePath(`/${locale}/dashboard/pms`);
  return { success: true, reservationId: reservation.id };
}
