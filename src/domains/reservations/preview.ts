"use server";

import { prisma } from "@/lib/db";
import { calculateHotelPriceBreakdown, calculateCarPriceBreakdown } from "./pricing";
import { resolveCoupon, getCommissionRate } from "./coupons";
import { getStayDynamicPricing, toNightlyPriceOverrideMap } from "@/domains/dynamic-pricing/resolver";
import type { CurrencyCode } from "@/generated/prisma/client";

type PreviewResult =
  | {
      success: true;
      currency: CurrencyCode;
      basePriceAmount: number;
      taxAmount: number;
      feeAmount: number;
      discountAmount: number;
      totalAmount: number;
      nights?: number;
      days?: number;
    }
  | { success: false; error: string };

export async function previewHotelPriceAction(params: {
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  quantity: number;
  couponCode?: string;
}): Promise<PreviewResult> {
  const checkIn = new Date(params.checkInDate);
  const checkOut = new Date(params.checkOutDate);
  if (!(checkOut > checkIn)) {
    return { success: false, error: "invalidDateRange" };
  }

  const roomType = await prisma.roomType.findFirst({
    where: { id: params.roomTypeId, isActive: true, deletedAt: null },
    include: {
      hotel: true,
      seasonalPrices: true,
      availabilityOverrides: { where: { date: { gte: checkIn, lt: checkOut } } },
    },
  });
  if (!roomType) return { success: false, error: "notFound" };

  const commissionRate = await getCommissionRate(roomType.hotel.organizationId, "HOTEL");

  const seasonalPrices = roomType.seasonalPrices.map((s) => ({
    startDate: s.startDate,
    endDate: s.endDate,
    price: Number(s.price),
    weekendPrice: s.weekendPrice ? Number(s.weekendPrice) : null,
  }));
  const overrides = roomType.availabilityOverrides.map((o) => ({
    date: o.date,
    priceOverride: o.priceOverride ? Number(o.priceOverride) : null,
    closedForBooking: o.closedForBooking,
  }));

  const dynamicPricing = await getStayDynamicPricing(
    roomType.hotel.organizationId,
    roomType,
    checkIn,
    checkOut
  );
  const nightlyPriceOverrides = toNightlyPriceOverrideMap(dynamicPricing);

  const preDiscount = calculateHotelPriceBreakdown({
    checkIn,
    checkOut,
    quantity: params.quantity,
    basePrice: Number(roomType.basePrice),
    weekendPrice: roomType.weekendPrice ? Number(roomType.weekendPrice) : null,
    taxRatePercent: Number(roomType.taxRatePercent),
    cleaningFee: Number(roomType.cleaningFee),
    seasonalPrices,
    overrides,
    commissionRate,
    discountAmount: 0,
    nightlyPriceOverrides,
  });

  const coupon = await resolveCoupon(
    params.couponCode,
    "HOTEL",
    roomType.hotel.organizationId,
    preDiscount.basePriceAmount + preDiscount.taxAmount + preDiscount.feeAmount
  );

  const breakdown = calculateHotelPriceBreakdown({
    checkIn,
    checkOut,
    quantity: params.quantity,
    basePrice: Number(roomType.basePrice),
    weekendPrice: roomType.weekendPrice ? Number(roomType.weekendPrice) : null,
    taxRatePercent: Number(roomType.taxRatePercent),
    cleaningFee: Number(roomType.cleaningFee),
    seasonalPrices,
    overrides,
    commissionRate,
    discountAmount: coupon.discountAmount,
    nightlyPriceOverrides,
  });

  return {
    success: true,
    currency: roomType.currency,
    basePriceAmount: breakdown.basePriceAmount,
    taxAmount: breakdown.taxAmount,
    feeAmount: breakdown.feeAmount,
    discountAmount: breakdown.discountAmount,
    totalAmount: breakdown.totalAmount,
    nights: breakdown.nights,
  };
}

export async function previewCarPriceAction(params: {
  vehicleId: string;
  pickupAt: string;
  returnAt: string;
  couponCode?: string;
}): Promise<PreviewResult> {
  const pickupAt = new Date(params.pickupAt);
  const returnAt = new Date(params.returnAt);
  if (!(returnAt > pickupAt)) {
    return { success: false, error: "invalidDateRange" };
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.vehicleId, deletedAt: null },
  });
  if (!vehicle) return { success: false, error: "notFound" };

  const commissionRate = await getCommissionRate(vehicle.organizationId, "CAR");

  const preDiscount = calculateCarPriceBreakdown({
    pickupAt,
    returnAt,
    pricePerDay: Number(vehicle.pricePerDay),
    commissionRate,
    discountAmount: 0,
  });

  const coupon = await resolveCoupon(
    params.couponCode,
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

  return {
    success: true,
    currency: vehicle.currency,
    basePriceAmount: breakdown.basePriceAmount,
    taxAmount: breakdown.taxAmount,
    feeAmount: breakdown.feeAmount,
    discountAmount: breakdown.discountAmount,
    totalAmount: breakdown.totalAmount,
    days: breakdown.days,
  };
}
