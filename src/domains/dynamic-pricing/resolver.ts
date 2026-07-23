import "server-only";
import { prisma } from "@/lib/db";
import { resolveNightlyPrice, isWeekendNight, toDateKey } from "@/domains/reservations/pricing";
import { hasFeature } from "@/domains/subscriptions/limits";
import { getStayOccupancy } from "./occupancy";
import { applyPricingRules, type RuleForEngine, type PricingContext } from "./engine";

type SeasonalPrice = {
  startDate: Date;
  endDate: Date;
  price: number;
  weekendPrice: number | null;
};

/**
 * Only rules that are active, approved (the staff approval workflow — a
 * rule with `requiresApproval` stays PENDING and is never applied here until
 * a manager approves it), inside their activation window, and scoped to
 * either this exact room type or the whole hotel (`roomTypeId: null`).
 */
export async function getApplicableRules(
  hotelId: string,
  roomTypeId: string
): Promise<RuleForEngine[]> {
  const now = new Date();
  const rules = await prisma.pricingRule.findMany({
    where: {
      hotelId,
      deletedAt: null,
      isActive: true,
      approvalStatus: "APPROVED",
      OR: [{ roomTypeId }, { roomTypeId: null }],
      AND: [
        { OR: [{ activeFrom: null }, { activeFrom: { lte: now } }] },
        { OR: [{ activeTo: null }, { activeTo: { gte: now } }] },
      ],
    },
  });

  return rules.map((r) => ({
    id: r.id,
    factor: r.factor,
    comparisonOperator: r.comparisonOperator,
    thresholdValue: r.thresholdValue != null ? Number(r.thresholdValue) : null,
    daysOfWeek: r.daysOfWeek,
    dateRangeStart: r.dateRangeStart,
    dateRangeEnd: r.dateRangeEnd,
    demandLevel: r.demandLevel,
    adjustmentType: r.adjustmentType,
    adjustmentValue: Number(r.adjustmentValue),
    priority: r.priority,
  }));
}

/**
 * Pure per-night resolution — no DB access. Always returns the season/base
 * price alongside the (possibly identical) dynamically-adjusted price;
 * `appliedRuleIds` is empty when nothing matched.
 */
export function resolveNightlyDynamicPrice(
  night: Date,
  params: {
    basePrice: number;
    weekendPrice: number | null;
    seasonalPrices: SeasonalPrice[];
    minPrice: number | null;
    maxPrice: number | null;
    rules: RuleForEngine[];
    bookingWindowDays: number;
    lengthOfStayNights: number;
    occupancyRatePercent: number;
    remainingInventory: number;
  }
): { basePrice: number; finalPrice: number; appliedRuleIds: string[] } {
  const seasonBasePrice = resolveNightlyPrice(
    night,
    params.basePrice,
    params.weekendPrice,
    params.seasonalPrices,
    []
  );

  const ctx: PricingContext = {
    date: night,
    dayOfWeek: night.getDay(),
    isWeekend: isWeekendNight(night),
    bookingWindowDays: params.bookingWindowDays,
    lengthOfStayNights: params.lengthOfStayNights,
    occupancyRatePercent: params.occupancyRatePercent,
    remainingInventory: params.remainingInventory,
  };

  const { finalPrice, appliedRuleIds } = applyPricingRules(seasonBasePrice, ctx, params.rules, {
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
  });

  return { basePrice: seasonBasePrice, finalPrice, appliedRuleIds };
}

/**
 * Resolves dynamic prices for every night of a single stay, using one
 * aggregate occupancy/remaining-inventory figure for the whole stay — the
 * same simplification the existing overbooking check in
 * src/domains/reservations/actions.ts already makes (RoomType.availableQuantity
 * is a small per-type unit count, not tracked per physical room here).
 * Nights with a manual `RoomAvailabilityOverride.priceOverride` are skipped
 * entirely so the manual value always wins.
 */
export async function resolveDynamicNightlyPrices(params: {
  hotelId: string;
  roomTypeId: string;
  basePrice: number;
  weekendPrice: number | null;
  seasonalPrices: SeasonalPrice[];
  minPrice: number | null;
  maxPrice: number | null;
  nights: Date[];
  overriddenDateKeys: Set<string>;
  checkInDate: Date;
  occupancyRatePercent: number;
  remainingInventory: number;
}): Promise<Map<string, { basePrice: number; finalPrice: number; appliedRuleIds: string[] }>> {
  const result = new Map<
    string,
    { basePrice: number; finalPrice: number; appliedRuleIds: string[] }
  >();

  const rules = await getApplicableRules(params.hotelId, params.roomTypeId);
  if (rules.length === 0) return result;

  const now = new Date();
  const bookingWindowDays = Math.max(
    0,
    Math.round((params.checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  for (const night of params.nights) {
    const dateKey = toDateKey(night);
    if (params.overriddenDateKeys.has(dateKey)) continue;

    const resolved = resolveNightlyDynamicPrice(night, {
      basePrice: params.basePrice,
      weekendPrice: params.weekendPrice,
      seasonalPrices: params.seasonalPrices,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      rules,
      bookingWindowDays,
      lengthOfStayNights: params.nights.length,
      occupancyRatePercent: params.occupancyRatePercent,
      remainingInventory: params.remainingInventory,
    });
    if (resolved.appliedRuleIds.length > 0) result.set(dateKey, resolved);
  }

  return result;
}

type RoomTypeForPricing = {
  id: string;
  hotelId: string;
  basePrice: { toString(): string } | number;
  weekendPrice: ({ toString(): string } | number) | null;
  minPrice: ({ toString(): string } | number) | null;
  maxPrice: ({ toString(): string } | number) | null;
  availableQuantity: number;
  seasonalPrices: {
    startDate: Date;
    endDate: Date;
    price: { toString(): string } | number;
    weekendPrice: ({ toString(): string } | number) | null;
  }[];
  availabilityOverrides: { date: Date; priceOverride: ({ toString(): string } | number) | null }[];
};

/**
 * One-call convenience used by both the price-preview and real-booking
 * paths: checks the organization's `featureDynamicPricing` flag, computes
 * whole-stay occupancy, and resolves the per-night dynamic price map — or an
 * empty map when the plan doesn't include Dynamic Pricing, so callers can
 * pass the result straight into `calculateHotelPriceBreakdown` unconditionally.
 */
export async function getStayDynamicPricing(
  organizationId: string,
  roomType: RoomTypeForPricing,
  checkIn: Date,
  checkOut: Date
): Promise<Map<string, { basePrice: number; finalPrice: number; appliedRuleIds: string[] }>> {
  const enabled = await hasFeature(organizationId, "featureDynamicPricing");
  if (!enabled) return new Map();

  const { occupancyRatePercent, remainingInventory } = await getStayOccupancy(
    roomType.id,
    checkIn,
    checkOut,
    roomType.availableQuantity
  );

  const overriddenDateKeys = new Set(
    roomType.availabilityOverrides
      .filter((o) => o.priceOverride != null)
      .map((o) => toDateKey(o.date))
  );

  const nights: Date[] = [];
  const cursor = new Date(checkIn);
  while (cursor < checkOut) {
    nights.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return resolveDynamicNightlyPrices({
    hotelId: roomType.hotelId,
    roomTypeId: roomType.id,
    basePrice: Number(roomType.basePrice),
    weekendPrice: roomType.weekendPrice != null ? Number(roomType.weekendPrice) : null,
    seasonalPrices: roomType.seasonalPrices.map((s) => ({
      startDate: s.startDate,
      endDate: s.endDate,
      price: Number(s.price),
      weekendPrice: s.weekendPrice != null ? Number(s.weekendPrice) : null,
    })),
    minPrice: roomType.minPrice != null ? Number(roomType.minPrice) : null,
    maxPrice: roomType.maxPrice != null ? Number(roomType.maxPrice) : null,
    nights,
    overriddenDateKeys,
    checkInDate: checkIn,
    occupancyRatePercent,
    remainingInventory,
  });
}

/** Reduces the full detail map to the bare `dateKey -> finalPrice` shape `calculateHotelPriceBreakdown` expects. */
export function toNightlyPriceOverrideMap(
  detail: Map<string, { basePrice: number; finalPrice: number; appliedRuleIds: string[] }>
): Map<string, number> {
  return new Map([...detail].map(([dateKey, v]) => [dateKey, v.finalPrice]));
}
