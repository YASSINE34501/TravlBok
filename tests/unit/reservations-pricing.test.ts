import { describe, it, expect } from "vitest";
import {
  enumerateNights,
  isWeekendNight,
  toDateKey,
  resolveNightlyPrice,
  calculateHotelPriceBreakdown,
  calculateCarPriceBreakdown,
} from "@/domains/reservations/pricing";

describe("enumerateNights / isWeekendNight / toDateKey", () => {
  it("enumerates exactly the nights of the stay (exclusive of checkout)", () => {
    const nights = enumerateNights(new Date("2026-08-01"), new Date("2026-08-04"));
    expect(nights).toHaveLength(3);
    expect(toDateKey(nights[0])).toBe("2026-08-01");
    expect(toDateKey(nights[2])).toBe("2026-08-03");
  });

  it("treats Friday and Saturday as weekend nights (this app's convention)", () => {
    expect(isWeekendNight(new Date("2026-08-07"))).toBe(true); // Friday
    expect(isWeekendNight(new Date("2026-08-08"))).toBe(true); // Saturday
    expect(isWeekendNight(new Date("2026-08-09"))).toBe(false); // Sunday
  });
});

describe("resolveNightlyPrice", () => {
  const seasonalPrices = [
    { startDate: new Date("2026-12-20"), endDate: new Date("2027-01-05"), price: 900, weekendPrice: 1100 },
  ];

  it("falls back to base/weekend price with no season or override", () => {
    expect(resolveNightlyPrice(new Date("2026-06-03"), 500, 600, [], [])).toBe(500); // Wednesday
    expect(resolveNightlyPrice(new Date("2026-06-05"), 500, 600, [], [])).toBe(600); // Friday
  });

  it("uses the season price over base/weekend when the date falls inside a season", () => {
    expect(resolveNightlyPrice(new Date("2026-12-24"), 500, 600, seasonalPrices, [])).toBe(900); // Thursday, in season
    expect(resolveNightlyPrice(new Date("2026-12-25"), 500, 600, seasonalPrices, [])).toBe(1100); // Friday, in season -> season weekend price
  });

  it("a manual per-date override always wins over season and base/weekend", () => {
    const overrides = [{ date: new Date("2026-12-24"), priceOverride: 1, closedForBooking: false }];
    expect(resolveNightlyPrice(new Date("2026-12-24"), 500, 600, seasonalPrices, overrides)).toBe(1);
  });
});

describe("calculateHotelPriceBreakdown", () => {
  it("computes tax/fee/discount/commission correctly with safe decimal rounding", () => {
    const breakdown = calculateHotelPriceBreakdown({
      checkIn: new Date("2026-08-01"),
      checkOut: new Date("2026-08-03"), // 2 nights
      quantity: 1,
      basePrice: 333.33,
      weekendPrice: null,
      taxRatePercent: 10,
      cleaningFee: 50,
      seasonalPrices: [],
      overrides: [],
      commissionRate: 0.15,
      discountAmount: 0,
    });

    // base = 333.33 * 2 = 666.66; fee = 50; tax = 10% of (666.66+50) = 71.666 -> 71.67
    expect(breakdown.nights).toBe(2);
    expect(breakdown.basePriceAmount).toBe(666.66);
    expect(breakdown.feeAmount).toBe(50);
    expect(breakdown.taxAmount).toBe(71.67);
    expect(breakdown.totalAmount).toBe(788.33);
    expect(breakdown.commissionAmount).toBe(Math.round(breakdown.totalAmount * 0.15 * 100) / 100);
  });

  it("caps the discount at the pre-discount total so totalAmount never goes negative", () => {
    const breakdown = calculateHotelPriceBreakdown({
      checkIn: new Date("2026-08-01"),
      checkOut: new Date("2026-08-02"),
      quantity: 1,
      basePrice: 100,
      weekendPrice: null,
      taxRatePercent: 0,
      cleaningFee: 0,
      seasonalPrices: [],
      overrides: [],
      commissionRate: 0,
      discountAmount: 999999,
    });
    expect(breakdown.discountAmount).toBe(100);
    expect(breakdown.totalAmount).toBe(0);
  });

  it("a nightlyPriceOverrides entry wins over the season/base calculation for that night only", () => {
    const breakdown = calculateHotelPriceBreakdown({
      checkIn: new Date("2026-08-01"),
      checkOut: new Date("2026-08-03"),
      quantity: 1,
      basePrice: 100,
      weekendPrice: null,
      taxRatePercent: 0,
      cleaningFee: 0,
      seasonalPrices: [],
      overrides: [],
      commissionRate: 0,
      discountAmount: 0,
      nightlyPriceOverrides: new Map([["2026-08-01", 250]]),
    });
    // night 1: dynamic override 250, night 2: falls back to base 100 -> 350 total
    expect(breakdown.basePriceAmount).toBe(350);
  });
});

describe("calculateCarPriceBreakdown", () => {
  it("rounds up partial days to a full day and applies commission on the discounted total", () => {
    const breakdown = calculateCarPriceBreakdown({
      pickupAt: new Date("2026-08-01T10:00:00Z"),
      returnAt: new Date("2026-08-02T14:00:00Z"), // 1 day 4 hours -> 2 billed days
      pricePerDay: 300,
      commissionRate: 0.1,
      discountAmount: 100,
    });
    expect(breakdown.days).toBe(2);
    expect(breakdown.basePriceAmount).toBe(600);
    expect(breakdown.discountAmount).toBe(100);
    expect(breakdown.totalAmount).toBe(500);
    expect(breakdown.commissionAmount).toBe(50);
  });

  it("never rents for less than one day", () => {
    const breakdown = calculateCarPriceBreakdown({
      pickupAt: new Date("2026-08-01T10:00:00Z"),
      returnAt: new Date("2026-08-01T12:00:00Z"),
      pricePerDay: 300,
      commissionRate: 0,
      discountAmount: 0,
    });
    expect(breakdown.days).toBe(1);
    expect(breakdown.totalAmount).toBe(300);
  });
});
