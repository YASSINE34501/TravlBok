import { describe, it, expect } from "vitest";
import { applyPricingRules, ruleMatches, deriveDemandLevel, type RuleForEngine, type PricingContext } from "@/domains/dynamic-pricing/engine";

function baseContext(overrides: Partial<PricingContext> = {}): PricingContext {
  return {
    date: new Date("2026-08-01"),
    dayOfWeek: 3,
    isWeekend: false,
    bookingWindowDays: 30,
    lengthOfStayNights: 2,
    occupancyRatePercent: 50,
    remainingInventory: 5,
    ...overrides,
  };
}

function baseRule(overrides: Partial<RuleForEngine> = {}): RuleForEngine {
  return {
    id: "rule-1",
    factor: "OCCUPANCY",
    comparisonOperator: "GTE",
    thresholdValue: 80,
    daysOfWeek: [],
    dateRangeStart: null,
    dateRangeEnd: null,
    demandLevel: null,
    adjustmentType: "PERCENTAGE",
    adjustmentValue: 20,
    priority: 0,
    ...overrides,
  };
}

describe("deriveDemandLevel", () => {
  it("buckets occupancy deterministically with no external signal", () => {
    expect(deriveDemandLevel(0)).toBe("LOW");
    expect(deriveDemandLevel(39.9)).toBe("LOW");
    expect(deriveDemandLevel(40)).toBe("MEDIUM");
    expect(deriveDemandLevel(74.9)).toBe("MEDIUM");
    expect(deriveDemandLevel(75)).toBe("HIGH");
    expect(deriveDemandLevel(100)).toBe("HIGH");
  });
});

describe("ruleMatches", () => {
  it("matches OCCUPANCY with GTE/LTE comparison operators", () => {
    const gte = baseRule({ factor: "OCCUPANCY", comparisonOperator: "GTE", thresholdValue: 80 });
    expect(ruleMatches(gte, baseContext({ occupancyRatePercent: 80 }))).toBe(true);
    expect(ruleMatches(gte, baseContext({ occupancyRatePercent: 79.9 }))).toBe(false);

    const lte = baseRule({ factor: "OCCUPANCY", comparisonOperator: "LTE", thresholdValue: 20 });
    expect(ruleMatches(lte, baseContext({ occupancyRatePercent: 20 }))).toBe(true);
    expect(ruleMatches(lte, baseContext({ occupancyRatePercent: 20.1 }))).toBe(false);
  });

  it("matches WEEKEND purely off the context flag", () => {
    const rule = baseRule({ factor: "WEEKEND", comparisonOperator: null, thresholdValue: null });
    expect(ruleMatches(rule, baseContext({ isWeekend: true }))).toBe(true);
    expect(ruleMatches(rule, baseContext({ isWeekend: false }))).toBe(false);
  });

  it("matches DAY_OF_WEEK against the configured day set", () => {
    const rule = baseRule({ factor: "DAY_OF_WEEK", daysOfWeek: [5, 6] });
    expect(ruleMatches(rule, baseContext({ dayOfWeek: 5 }))).toBe(true);
    expect(ruleMatches(rule, baseContext({ dayOfWeek: 3 }))).toBe(false);
  });

  it("matches SEASON/HOLIDAY/SPECIAL_EVENT against an inclusive date range", () => {
    const rule = baseRule({
      factor: "HOLIDAY",
      dateRangeStart: new Date("2026-12-20"),
      dateRangeEnd: new Date("2026-12-31"),
    });
    expect(ruleMatches(rule, baseContext({ date: new Date("2026-12-25") }))).toBe(true);
    expect(ruleMatches(rule, baseContext({ date: new Date("2026-12-20") }))).toBe(true);
    expect(ruleMatches(rule, baseContext({ date: new Date("2026-12-31") }))).toBe(true);
    expect(ruleMatches(rule, baseContext({ date: new Date("2027-01-01") }))).toBe(false);
  });

  it("matches BOOKING_WINDOW and LENGTH_OF_STAY numerically", () => {
    const window = baseRule({ factor: "BOOKING_WINDOW", comparisonOperator: "LTE", thresholdValue: 3 });
    expect(ruleMatches(window, baseContext({ bookingWindowDays: 2 }))).toBe(true);
    expect(ruleMatches(window, baseContext({ bookingWindowDays: 4 }))).toBe(false);

    const los = baseRule({ factor: "LENGTH_OF_STAY", comparisonOperator: "GTE", thresholdValue: 7 });
    expect(ruleMatches(los, baseContext({ lengthOfStayNights: 7 }))).toBe(true);
    expect(ruleMatches(los, baseContext({ lengthOfStayNights: 6 }))).toBe(false);
  });

  it("matches DEMAND_LEVEL via the same deterministic bucketing as deriveDemandLevel", () => {
    const rule = baseRule({ factor: "DEMAND_LEVEL", demandLevel: "HIGH" });
    expect(ruleMatches(rule, baseContext({ occupancyRatePercent: 90 }))).toBe(true);
    expect(ruleMatches(rule, baseContext({ occupancyRatePercent: 50 }))).toBe(false);
  });

  it("REMAINING_INVENTORY compares the live count, not a percentage", () => {
    const rule = baseRule({ factor: "REMAINING_INVENTORY", comparisonOperator: "LTE", thresholdValue: 2 });
    expect(ruleMatches(rule, baseContext({ remainingInventory: 2 }))).toBe(true);
    expect(ruleMatches(rule, baseContext({ remainingInventory: 3 }))).toBe(false);
  });
});

describe("applyPricingRules", () => {
  it("returns the base price untouched with no rules", () => {
    const { finalPrice, appliedRuleIds } = applyPricingRules(1000, baseContext(), [], {
      minPrice: null,
      maxPrice: null,
    });
    expect(finalPrice).toBe(1000);
    expect(appliedRuleIds).toEqual([]);
  });

  it("stacks multiple matching rules in ascending priority order", () => {
    const rules: RuleForEngine[] = [
      baseRule({ id: "occupancy-surcharge", factor: "OCCUPANCY", comparisonOperator: "GTE", thresholdValue: 80, adjustmentType: "PERCENTAGE", adjustmentValue: 20, priority: 0 }),
      baseRule({ id: "weekend-surcharge", factor: "WEEKEND", comparisonOperator: null, thresholdValue: null, adjustmentType: "FIXED_AMOUNT", adjustmentValue: 50, priority: 1 }),
    ];
    const { finalPrice, appliedRuleIds } = applyPricingRules(
      1000,
      baseContext({ occupancyRatePercent: 90, isWeekend: true }),
      rules,
      { minPrice: null, maxPrice: null }
    );
    // 1000 * 1.2 = 1200, then +50 = 1250
    expect(finalPrice).toBe(1250);
    expect(appliedRuleIds).toEqual(["occupancy-surcharge", "weekend-surcharge"]);
  });

  it("never breaches the configured maxPrice even when rules would push higher", () => {
    const rules: RuleForEngine[] = [
      baseRule({ adjustmentType: "PERCENTAGE", adjustmentValue: 100 }), // would double the price
    ];
    const { finalPrice } = applyPricingRules(1000, baseContext({ occupancyRatePercent: 90 }), rules, {
      minPrice: null,
      maxPrice: 1500,
    });
    expect(finalPrice).toBe(1500);
  });

  it("never breaches the configured minPrice even when a discount rule overshoots", () => {
    const rules: RuleForEngine[] = [
      baseRule({
        factor: "BOOKING_WINDOW",
        comparisonOperator: "GTE",
        thresholdValue: 60,
        adjustmentType: "PERCENTAGE",
        adjustmentValue: -90,
      }),
    ];
    const { finalPrice } = applyPricingRules(1000, baseContext({ bookingWindowDays: 90 }), rules, {
      minPrice: 400,
      maxPrice: null,
    });
    expect(finalPrice).toBe(400);
  });

  it("applies priority order deterministically regardless of input array order", () => {
    const ruleA = baseRule({ id: "a", factor: "WEEKEND", comparisonOperator: null, thresholdValue: null, adjustmentType: "PERCENTAGE", adjustmentValue: 10, priority: 2 });
    const ruleB = baseRule({ id: "b", factor: "WEEKEND", comparisonOperator: null, thresholdValue: null, adjustmentType: "FIXED_AMOUNT", adjustmentValue: 20, priority: 1 });

    const forward = applyPricingRules(1000, baseContext({ isWeekend: true }), [ruleA, ruleB], { minPrice: null, maxPrice: null });
    const reversed = applyPricingRules(1000, baseContext({ isWeekend: true }), [ruleB, ruleA], { minPrice: null, maxPrice: null });

    // b (priority 1, +20 fixed) must always apply before a (priority 2, +10%):
    // (1000 + 20) * 1.10 = 1122
    expect(forward.finalPrice).toBe(1122);
    expect(reversed.finalPrice).toBe(1122);
  });
});
