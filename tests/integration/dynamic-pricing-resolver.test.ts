import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { getApplicableRules, resolveDynamicNightlyPrices } from "@/domains/dynamic-pricing/resolver";

describe("dynamic pricing rule resolution (real getApplicableRules/resolveDynamicNightlyPrices, real DB)", () => {
  let hotelId: string;
  let roomTypeId: string;
  let userId: string;
  let organizationId: string;
  const ruleIds: string[] = [];

  beforeAll(async () => {
    const org = await prisma.organization.findFirstOrThrow({ where: { type: "HOTEL", deletedAt: null } });
    organizationId = org.id;
    const owner = await prisma.user.findFirstOrThrow({ where: { role: "HOTEL_OWNER" } });
    userId = owner.id;

    const hotel = await prisma.hotel.create({
      data: { organizationId, name: "TEST-DYN-PRICING-HOTEL", description: { en: "t" }, address: "a" },
    });
    hotelId = hotel.id;

    const roomType = await prisma.roomType.create({
      data: {
        hotelId,
        name: "TEST-DYN-PRICING-ROOM",
        roomTypeLabel: "STANDARD",
        description: { en: "t" },
        maxGuests: 2,
        maxAdults: 2,
        basePrice: 1000,
        minPrice: 900,
        maxPrice: 1300,
        availableQuantity: 4,
        currency: "MAD",
      },
    });
    roomTypeId = roomType.id;
  });

  afterAll(async () => {
    await prisma.pricingRule.deleteMany({ where: { id: { in: ruleIds } } });
    await prisma.roomType.delete({ where: { id: roomTypeId } });
    await prisma.hotel.delete({ where: { id: hotelId } });
  });

  it("getApplicableRules excludes PENDING (unapproved) rules from the live set", async () => {
    const pending = await prisma.pricingRule.create({
      data: {
        hotelId,
        roomTypeId,
        name: "pending rule",
        factor: "OCCUPANCY",
        comparisonOperator: "GTE",
        thresholdValue: 50,
        adjustmentType: "PERCENTAGE",
        adjustmentValue: 10,
        requiresApproval: true,
        approvalStatus: "PENDING",
        createdById: userId,
      },
    });
    ruleIds.push(pending.id);

    const rules = await getApplicableRules(hotelId, roomTypeId);
    expect(rules.find((r) => r.id === pending.id)).toBeUndefined();
  });

  it("getApplicableRules includes an approved, active, hotel-wide rule (roomTypeId: null)", async () => {
    const approved = await prisma.pricingRule.create({
      data: {
        hotelId,
        roomTypeId: null, // hotel-wide
        name: "approved hotel-wide rule",
        factor: "WEEKEND",
        adjustmentType: "PERCENTAGE",
        adjustmentValue: 15,
        isActive: true,
        approvalStatus: "APPROVED",
        createdById: userId,
      },
    });
    ruleIds.push(approved.id);

    const rules = await getApplicableRules(hotelId, roomTypeId);
    expect(rules.find((r) => r.id === approved.id)).toBeTruthy();
  });

  it("excludes an approved rule outside its activation window (activeTo in the past)", async () => {
    const expired = await prisma.pricingRule.create({
      data: {
        hotelId,
        roomTypeId,
        name: "expired rule",
        factor: "WEEKEND",
        adjustmentType: "PERCENTAGE",
        adjustmentValue: 25,
        isActive: true,
        approvalStatus: "APPROVED",
        activeTo: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
        createdById: userId,
      },
    });
    ruleIds.push(expired.id);

    const rules = await getApplicableRules(hotelId, roomTypeId);
    expect(rules.find((r) => r.id === expired.id)).toBeUndefined();
  });

  it("resolveDynamicNightlyPrices applies the live WEEKEND rule and clamps to maxPrice, skipping manually-overridden nights", async () => {
    // Pick a deterministic future Friday (this app's isWeekendNight treats
    // Friday/Saturday as weekend) so the WEEKEND rule above is guaranteed to
    // fire, rather than depending on whatever day-of-week "N days from now" happens to be.
    const checkIn = new Date();
    checkIn.setHours(0, 0, 0, 0);
    checkIn.setDate(checkIn.getDate() + 200);
    while (checkIn.getDay() !== 5) checkIn.setDate(checkIn.getDate() + 1); // advance to the next Friday
    const saturday = new Date(checkIn);
    saturday.setDate(saturday.getDate() + 1); // the manually-overridden night

    const dateKey = (d: Date) => d.toISOString().slice(0, 10);
    const overriddenDateKeys = new Set([dateKey(saturday)]);

    const result = await resolveDynamicNightlyPrices({
      hotelId,
      roomTypeId,
      basePrice: 1000,
      weekendPrice: null,
      seasonalPrices: [],
      minPrice: 900,
      maxPrice: 1300,
      nights: [checkIn, saturday],
      overriddenDateKeys,
      checkInDate: checkIn,
      occupancyRatePercent: 95,
      remainingInventory: 1,
    });

    // Saturday is in overriddenDateKeys -> must never appear in the dynamic map (manual override wins).
    expect(result.has(dateKey(saturday))).toBe(false);

    // Friday is a real weekend night and not overridden -> the earlier
    // approved hotel-wide WEEKEND rule (+15%, 1000 -> 1150) must have fired.
    // (The PENDING and expired rules from the earlier tests are correctly
    // excluded, so this is the only rule in play.)
    const fridayEntry = result.get(dateKey(checkIn));
    expect(fridayEntry).toBeDefined();
    expect(fridayEntry!.appliedRuleIds.length).toBeGreaterThan(0);
    expect(fridayEntry!.finalPrice).toBeLessThanOrEqual(1300);
    expect(fridayEntry!.finalPrice).toBeGreaterThanOrEqual(900);
  });
});
