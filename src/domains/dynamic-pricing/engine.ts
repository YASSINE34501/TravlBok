import "server-only";
import type {
  PricingRuleFactor,
  PricingComparisonOperator,
  PricingAdjustmentType,
  DemandLevel,
} from "@/generated/prisma/client";

export type PricingContext = {
  date: Date;
  dayOfWeek: number;
  isWeekend: boolean;
  bookingWindowDays: number;
  lengthOfStayNights: number;
  occupancyRatePercent: number;
  remainingInventory: number;
};

export type RuleForEngine = {
  id: string;
  factor: PricingRuleFactor;
  comparisonOperator: PricingComparisonOperator | null;
  thresholdValue: number | null;
  daysOfWeek: number[];
  dateRangeStart: Date | null;
  dateRangeEnd: Date | null;
  demandLevel: DemandLevel | null;
  adjustmentType: PricingAdjustmentType;
  adjustmentValue: number;
  priority: number;
};

/** Deterministic demand bucketing from occupancy — no external AI/ML, per MASTER-PLAN. */
export function deriveDemandLevel(occupancyRatePercent: number): DemandLevel {
  if (occupancyRatePercent >= 75) return "HIGH";
  if (occupancyRatePercent >= 40) return "MEDIUM";
  return "LOW";
}

function compare(value: number, op: PricingComparisonOperator | null, threshold: number | null): boolean {
  if (op == null || threshold == null) return false;
  return op === "GTE" ? value >= threshold : value <= threshold;
}

export function ruleMatches(rule: RuleForEngine, ctx: PricingContext): boolean {
  switch (rule.factor) {
    case "WEEKEND":
      return ctx.isWeekend;
    case "DAY_OF_WEEK":
      return rule.daysOfWeek.includes(ctx.dayOfWeek);
    case "SEASON":
    case "HOLIDAY":
    case "SPECIAL_EVENT":
      return (
        rule.dateRangeStart != null &&
        rule.dateRangeEnd != null &&
        ctx.date >= rule.dateRangeStart &&
        ctx.date <= rule.dateRangeEnd
      );
    case "OCCUPANCY":
      return compare(ctx.occupancyRatePercent, rule.comparisonOperator, rule.thresholdValue);
    case "REMAINING_INVENTORY":
      return compare(ctx.remainingInventory, rule.comparisonOperator, rule.thresholdValue);
    case "BOOKING_WINDOW":
      return compare(ctx.bookingWindowDays, rule.comparisonOperator, rule.thresholdValue);
    case "LENGTH_OF_STAY":
      return compare(ctx.lengthOfStayNights, rule.comparisonOperator, rule.thresholdValue);
    case "DEMAND_LEVEL":
      return rule.demandLevel === deriveDemandLevel(ctx.occupancyRatePercent);
  }
}

/**
 * Applies every matching rule in ascending `priority` order (rules stack —
 * e.g. an occupancy surcharge and a weekend surcharge can both fire on the
 * same night), then clamps to [minPrice, maxPrice] — MASTER-PLAN's "never
 * breach min/max prices" is enforced here centrally, once, rather than by
 * trusting each rule to respect the bound individually.
 */
export function applyPricingRules(
  basePrice: number,
  ctx: PricingContext,
  rules: RuleForEngine[],
  bounds: { minPrice: number | null; maxPrice: number | null }
): { finalPrice: number; appliedRuleIds: string[] } {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);
  let price = basePrice;
  const appliedRuleIds: string[] = [];

  for (const rule of sorted) {
    if (!ruleMatches(rule, ctx)) continue;
    price =
      rule.adjustmentType === "PERCENTAGE"
        ? price * (1 + rule.adjustmentValue / 100)
        : price + rule.adjustmentValue;
    appliedRuleIds.push(rule.id);
  }

  if (bounds.minPrice != null) price = Math.max(price, bounds.minPrice);
  if (bounds.maxPrice != null) price = Math.min(price, bounds.maxPrice);

  return { finalPrice: Math.round(Math.max(0, price) * 100) / 100, appliedRuleIds };
}
