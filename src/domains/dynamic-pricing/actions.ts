"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrganizationAccess, requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { hasFeature } from "@/domains/subscriptions/limits";
import { pricingRuleSchema, type PricingRuleInput } from "@/lib/validation/pricing-rule";
import { toDateKey } from "@/domains/reservations/pricing";
import { getStayOccupancy, computeDailyOccupancy } from "./occupancy";
import { resolveDynamicNightlyPrices, resolveNightlyDynamicPrice, getApplicableRules } from "./resolver";
import type { Role } from "@/generated/prisma/client";

type ActionResult = { success: true } | { success: false; error: string };

const PRICING_MANAGER_ROLES: Role[] = ["HOTEL_OWNER", "HOTEL_MANAGER", "HOTEL_ACCOUNTANT"];
const PRICING_APPROVER_ROLES: Role[] = ["HOTEL_OWNER", "HOTEL_MANAGER"];

async function requirePricingAccess(locale: string, organizationId: string, roles: Role[]) {
  const user = await requireOrganizationAccess(locale, organizationId, roles);
  const enabled = await hasFeature(organizationId, "featureDynamicPricing");
  if (!enabled) {
    throw new Error("Dynamic Pricing is not enabled on this organization's plan");
  }
  return user;
}

function nullableDate(value?: string): Date | null {
  return value ? new Date(value) : null;
}

export async function createPricingRuleAction(
  locale: string,
  organizationId: string,
  input: PricingRuleInput
): Promise<ActionResult> {
  const user = await requirePricingAccess(locale, organizationId, PRICING_MANAGER_ROLES);

  const parsed = pricingRuleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalidInput" };
  const data = parsed.data;

  const hotel = await prisma.hotel.findFirst({ where: { id: data.hotelId, organizationId } });
  if (!hotel) return { success: false, error: "notFound" };

  if (data.roomTypeId) {
    const roomType = await prisma.roomType.findFirst({
      where: { id: data.roomTypeId, hotelId: data.hotelId },
    });
    if (!roomType) return { success: false, error: "notFound" };
  }

  const rule = await prisma.pricingRule.create({
    data: {
      hotelId: data.hotelId,
      roomTypeId: data.roomTypeId || null,
      name: data.name,
      description: data.description || null,
      factor: data.factor,
      comparisonOperator: data.comparisonOperator,
      thresholdValue: data.thresholdValue,
      daysOfWeek: data.daysOfWeek ?? [],
      dateRangeStart: nullableDate(data.dateRangeStart),
      dateRangeEnd: nullableDate(data.dateRangeEnd),
      demandLevel: data.demandLevel,
      adjustmentType: data.adjustmentType,
      adjustmentValue: data.adjustmentValue,
      priority: data.priority,
      activeFrom: nullableDate(data.activeFrom),
      activeTo: nullableDate(data.activeTo),
      requiresApproval: data.requiresApproval,
      approvalStatus: data.requiresApproval ? "PENDING" : "APPROVED",
      createdById: user.id,
    },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "dynamic_pricing.rule.create",
    entityType: "PricingRule",
    entityId: rule.id,
    metadata: { factor: data.factor, hotelId: data.hotelId },
  });

  revalidatePath(`/${locale}/dashboard/pricing`);
  return { success: true };
}

export async function updatePricingRuleAction(
  locale: string,
  organizationId: string,
  ruleId: string,
  input: PricingRuleInput
): Promise<ActionResult> {
  const user = await requirePricingAccess(locale, organizationId, PRICING_MANAGER_ROLES);

  const parsed = pricingRuleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalidInput" };
  const data = parsed.data;

  const existing = await prisma.pricingRule.findFirst({
    where: { id: ruleId, hotel: { organizationId }, deletedAt: null },
  });
  if (!existing) return { success: false, error: "notFound" };

  await prisma.pricingRule.update({
    where: { id: ruleId },
    data: {
      roomTypeId: data.roomTypeId || null,
      name: data.name,
      description: data.description || null,
      factor: data.factor,
      comparisonOperator: data.comparisonOperator,
      thresholdValue: data.thresholdValue,
      daysOfWeek: data.daysOfWeek ?? [],
      dateRangeStart: nullableDate(data.dateRangeStart),
      dateRangeEnd: nullableDate(data.dateRangeEnd),
      demandLevel: data.demandLevel,
      adjustmentType: data.adjustmentType,
      adjustmentValue: data.adjustmentValue,
      priority: data.priority,
      activeFrom: nullableDate(data.activeFrom),
      activeTo: nullableDate(data.activeTo),
      requiresApproval: data.requiresApproval,
      // Editing a rule that requires approval always sends it back for
      // re-approval — a manager should see exactly what they're signing off on.
      approvalStatus: data.requiresApproval ? "PENDING" : "APPROVED",
      approvedById: data.requiresApproval ? null : existing.approvedById,
      approvedAt: data.requiresApproval ? null : existing.approvedAt,
    },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "dynamic_pricing.rule.update",
    entityType: "PricingRule",
    entityId: ruleId,
  });

  revalidatePath(`/${locale}/dashboard/pricing`);
  return { success: true };
}

export async function archivePricingRuleAction(
  locale: string,
  organizationId: string,
  ruleId: string
): Promise<ActionResult> {
  const user = await requirePricingAccess(locale, organizationId, PRICING_MANAGER_ROLES);

  const existing = await prisma.pricingRule.findFirst({
    where: { id: ruleId, hotel: { organizationId }, deletedAt: null },
  });
  if (!existing) return { success: false, error: "notFound" };

  await prisma.pricingRule.update({
    where: { id: ruleId },
    data: { deletedAt: new Date(), isActive: false },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "dynamic_pricing.rule.archive",
    entityType: "PricingRule",
    entityId: ruleId,
  });

  revalidatePath(`/${locale}/dashboard/pricing`);
  return { success: true };
}

export async function toggleRuleActiveAction(
  locale: string,
  organizationId: string,
  ruleId: string,
  isActive: boolean
): Promise<ActionResult> {
  await requirePricingAccess(locale, organizationId, PRICING_MANAGER_ROLES);

  await prisma.pricingRule.update({
    where: { id: ruleId, hotel: { organizationId } },
    data: { isActive },
  });

  revalidatePath(`/${locale}/dashboard/pricing`);
  return { success: true };
}

export async function approveRuleAction(
  locale: string,
  organizationId: string,
  ruleId: string
): Promise<ActionResult> {
  const user = await requirePricingAccess(locale, organizationId, PRICING_APPROVER_ROLES);

  const existing = await prisma.pricingRule.findFirst({
    where: { id: ruleId, hotel: { organizationId }, deletedAt: null },
  });
  if (!existing) return { success: false, error: "notFound" };

  await prisma.pricingRule.update({
    where: { id: ruleId },
    data: { approvalStatus: "APPROVED", approvedById: user.id, approvedAt: new Date() },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "dynamic_pricing.rule.approve",
    entityType: "PricingRule",
    entityId: ruleId,
  });

  revalidatePath(`/${locale}/dashboard/pricing`);
  return { success: true };
}

export async function rejectRuleAction(
  locale: string,
  organizationId: string,
  ruleId: string
): Promise<ActionResult> {
  const user = await requirePricingAccess(locale, organizationId, PRICING_APPROVER_ROLES);

  const existing = await prisma.pricingRule.findFirst({
    where: { id: ruleId, hotel: { organizationId }, deletedAt: null },
  });
  if (!existing) return { success: false, error: "notFound" };

  await prisma.pricingRule.update({
    where: { id: ruleId },
    data: { approvalStatus: "REJECTED", isActive: false, approvedById: user.id, approvedAt: new Date() },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "dynamic_pricing.rule.reject",
    entityType: "PricingRule",
    entityId: ruleId,
  });

  revalidatePath(`/${locale}/dashboard/pricing`);
  return { success: true };
}

export type SimulationNight = {
  date: string;
  basePrice: number;
  finalPrice: number;
  appliedRuleIds: string[];
};

type SimulationResult =
  | { success: true; nights: SimulationNight[]; occupancyRatePercent: number; remainingInventory: number }
  | { success: false; error: string };

/**
 * Simulation mode: runs the exact same engine a real booking would, for a
 * hypothetical stay, but never writes DynamicPriceLog — lets staff preview a
 * rule's effect before relying on it.
 */
export async function simulatePricingAction(
  locale: string,
  organizationId: string,
  input: { roomTypeId: string; checkInDate: string; checkOutDate: string }
): Promise<SimulationResult> {
  await requirePricingAccess(locale, organizationId, PRICING_MANAGER_ROLES);

  const roomType = await prisma.roomType.findFirst({
    where: { id: input.roomTypeId, hotel: { organizationId } },
    include: { hotel: true, seasonalPrices: true, availabilityOverrides: true },
  });
  if (!roomType) return { success: false, error: "notFound" };

  const checkIn = new Date(input.checkInDate);
  const checkOut = new Date(input.checkOutDate);
  if (!(checkOut > checkIn)) return { success: false, error: "invalidDateRange" };

  const { occupancyRatePercent, remainingInventory } = await getStayOccupancy(
    roomType.id,
    checkIn,
    checkOut,
    roomType.availableQuantity
  );

  const overriddenDateKeys = new Set(
    roomType.availabilityOverrides.filter((o) => o.priceOverride != null).map((o) => toDateKey(o.date))
  );

  const nights: Date[] = [];
  const cursor = new Date(checkIn);
  while (cursor < checkOut) {
    nights.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const dynamicMap = await resolveDynamicNightlyPrices({
    hotelId: roomType.hotelId,
    roomTypeId: roomType.id,
    basePrice: Number(roomType.basePrice),
    weekendPrice: roomType.weekendPrice ? Number(roomType.weekendPrice) : null,
    seasonalPrices: roomType.seasonalPrices.map((s) => ({
      startDate: s.startDate,
      endDate: s.endDate,
      price: Number(s.price),
      weekendPrice: s.weekendPrice ? Number(s.weekendPrice) : null,
    })),
    minPrice: roomType.minPrice ? Number(roomType.minPrice) : null,
    maxPrice: roomType.maxPrice ? Number(roomType.maxPrice) : null,
    nights,
    overriddenDateKeys,
    checkInDate: checkIn,
    occupancyRatePercent,
    remainingInventory,
  });

  const resultNights: SimulationNight[] = nights.map((night) => {
    const dateKey = toDateKey(night);
    const dynamic = dynamicMap.get(dateKey);
    const staticPrice =
      dynamic?.basePrice ??
      Number(
        roomType.availabilityOverrides.find((o) => toDateKey(o.date) === dateKey)?.priceOverride ??
          roomType.basePrice
      );
    return {
      date: dateKey,
      basePrice: staticPrice,
      finalPrice: dynamic?.finalPrice ?? staticPrice,
      appliedRuleIds: dynamic?.appliedRuleIds ?? [],
    };
  });

  return { success: true, nights: resultNights, occupancyRatePercent, remainingInventory };
}

/**
 * Bulk update / pricing-calendar materialization: recomputes and persists a
 * DynamicPriceLog row (source RECALCULATED) for every night in the range
 * using real per-day occupancy, so the pricing calendar and price history
 * views have forward-looking data without waiting for real bookings.
 */
export async function recalculatePricingCalendarAction(
  locale: string,
  organizationId: string,
  input: { roomTypeId: string; startDate: string; endDate: string }
): Promise<ActionResult> {
  const user = await requirePricingAccess(locale, organizationId, PRICING_MANAGER_ROLES);

  const roomType = await prisma.roomType.findFirst({
    where: { id: input.roomTypeId, hotel: { organizationId } },
    include: { seasonalPrices: true, availabilityOverrides: true },
  });
  if (!roomType) return { success: false, error: "notFound" };

  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  if (!(endDate > startDate)) return { success: false, error: "invalidDateRange" };

  const [occupancyByDay, rules] = await Promise.all([
    computeDailyOccupancy(roomType.id, startDate, endDate),
    getApplicableRules(roomType.hotelId, roomType.id),
  ]);
  const occupancyByDate = new Map(occupancyByDay.map((o) => [o.date, o]));

  const overriddenDateKeys = new Set(
    roomType.availabilityOverrides.filter((o) => o.priceOverride != null).map((o) => toDateKey(o.date))
  );

  const seasonalPrices = roomType.seasonalPrices.map((s) => ({
    startDate: s.startDate,
    endDate: s.endDate,
    price: Number(s.price),
    weekendPrice: s.weekendPrice ? Number(s.weekendPrice) : null,
  }));
  const minPrice = roomType.minPrice ? Number(roomType.minPrice) : null;
  const maxPrice = roomType.maxPrice ? Number(roomType.maxPrice) : null;

  const nights: Date[] = [];
  const cursor = new Date(startDate);
  while (cursor < endDate) {
    nights.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  let written = 0;
  for (const night of nights) {
    const dateKey = toDateKey(night);
    if (overriddenDateKeys.has(dateKey)) continue;
    const dayOccupancy = occupancyByDate.get(dateKey);
    if (!dayOccupancy) continue;

    const bookingWindowDays = Math.max(
      0,
      Math.round((night.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );

    const resolved = resolveNightlyDynamicPrice(night, {
      basePrice: Number(roomType.basePrice),
      weekendPrice: roomType.weekendPrice ? Number(roomType.weekendPrice) : null,
      seasonalPrices,
      minPrice,
      maxPrice,
      rules,
      bookingWindowDays,
      lengthOfStayNights: 1,
      occupancyRatePercent: dayOccupancy.occupancyRatePercent,
      remainingInventory: dayOccupancy.remainingInventory,
    });

    await prisma.dynamicPriceLog.upsert({
      where: { roomTypeId_date: { roomTypeId: roomType.id, date: night } },
      update: {
        basePrice: resolved.basePrice,
        finalPrice: resolved.finalPrice,
        appliedRuleIds: resolved.appliedRuleIds,
        occupancyRatePercent: dayOccupancy.occupancyRatePercent,
        remainingInventory: dayOccupancy.remainingInventory,
        source: "RECALCULATED",
      },
      create: {
        roomTypeId: roomType.id,
        date: night,
        basePrice: resolved.basePrice,
        finalPrice: resolved.finalPrice,
        appliedRuleIds: resolved.appliedRuleIds,
        occupancyRatePercent: dayOccupancy.occupancyRatePercent,
        remainingInventory: dayOccupancy.remainingInventory,
        source: "RECALCULATED",
      },
    });
    written += 1;
  }

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "dynamic_pricing.calendar.recalculate",
    entityType: "RoomType",
    entityId: roomType.id,
    metadata: { nights: written },
  });

  revalidatePath(`/${locale}/dashboard/pricing`);
  return { success: true };
}

export type PriceHistoryEntry = {
  date: string;
  basePrice: number;
  finalPrice: number;
  appliedRuleIds: string[];
  source: string;
};

type PriceHistoryResult =
  | { success: true; entries: PriceHistoryEntry[] }
  | { success: false; error: string };

export async function getPriceHistoryAction(
  locale: string,
  organizationId: string,
  input: { roomTypeId: string; startDate: string; endDate: string }
): Promise<PriceHistoryResult> {
  await requireOrganizationAccess(locale, organizationId, ROLE_GROUPS.hotelStaff);

  const roomType = await prisma.roomType.findFirst({
    where: { id: input.roomTypeId, hotel: { organizationId } },
  });
  if (!roomType) return { success: false, error: "notFound" };

  const logs = await prisma.dynamicPriceLog.findMany({
    where: {
      roomTypeId: input.roomTypeId,
      date: { gte: new Date(input.startDate), lt: new Date(input.endDate) },
    },
    orderBy: { date: "asc" },
  });

  return {
    success: true,
    entries: logs.map((l) => ({
      date: toDateKey(l.date),
      basePrice: Number(l.basePrice),
      finalPrice: Number(l.finalPrice),
      appliedRuleIds: l.appliedRuleIds,
      source: l.source,
    })),
  };
}

// ---- Super Admin oversight ----

export async function adminSetRuleStatusAction(
  locale: string,
  ruleId: string,
  status: "APPROVED" | "REJECTED"
): Promise<ActionResult> {
  const admin = await requireRole(locale, ROLE_GROUPS.platformStaff);

  await prisma.pricingRule.update({
    where: { id: ruleId },
    data: {
      approvalStatus: status,
      isActive: status === "APPROVED",
      approvedById: admin.id,
      approvedAt: new Date(),
    },
  });

  await logAudit({
    actorUserId: admin.id,
    action: `admin.dynamic_pricing.rule.${status === "APPROVED" ? "approve" : "reject"}`,
    entityType: "PricingRule",
    entityId: ruleId,
  });

  revalidatePath(`/${locale}/admin/pricing`);
  return { success: true };
}
