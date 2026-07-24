import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { checkOrganizationLimit, hasFeature } from "@/domains/subscriptions/limits";

describe("subscription limits & feature gating (real checkOrganizationLimit/hasFeature, real DB)", () => {
  let organizationId: string;
  let planId: string;
  const hotelIds: string[] = [];

  beforeAll(async () => {
    const org = await prisma.organization.create({
      data: {
        type: "HOTEL",
        legalName: "TEST-LIMITS-ORG",
        displayName: "TEST-LIMITS-ORG",
      },
    });
    organizationId = org.id;

    const plan = await prisma.subscriptionPlan.create({
      data: {
        tier: "STARTER",
        name: { en: "Test Limits Plan" },
        monthlyPrice: 0,
        annualPrice: 0,
        maxProperties: 2,
        featureDynamicPricing: false,
        isCustom: true,
      },
    });
    planId = plan.id;

    await prisma.subscription.create({
      data: {
        organizationId,
        planId,
        status: "ACTIVE",
        billingInterval: "MONTHLY",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  });

  afterAll(async () => {
    await prisma.hotel.deleteMany({ where: { id: { in: hotelIds } } });
    await prisma.subscription.delete({ where: { organizationId } });
    await prisma.subscriptionPlan.delete({ where: { id: planId } });
    await prisma.organization.delete({ where: { id: organizationId } });
  });

  it("allows creating properties while under the plan's maxProperties limit", async () => {
    const before = await checkOrganizationLimit(organizationId, "PROPERTIES");
    expect(before.allowed).toBe(true);

    const hotel = await prisma.hotel.create({
      data: {
        organizationId,
        name: "TEST-LIMITS-HOTEL-1",
        description: { en: "t" },
        address: "a",
      },
    });
    hotelIds.push(hotel.id);
  });

  it("blocks creating a property once the plan's maxProperties limit is reached", async () => {
    const hotel = await prisma.hotel.create({
      data: {
        organizationId,
        name: "TEST-LIMITS-HOTEL-2",
        description: { en: "t" },
        address: "a",
      },
    });
    hotelIds.push(hotel.id);

    // maxProperties is 2, and we now have exactly 2 hotels for this org.
    const result = await checkOrganizationLimit(organizationId, "PROPERTIES");
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("planLimitReached");
      expect(result.limit).toBe(2);
      expect(result.current).toBe(2);
    }
  });

  it("reports no active subscription for an organization with none", async () => {
    const orphanOrg = await prisma.organization.create({
      data: { type: "HOTEL", legalName: "TEST-NO-SUB-ORG", displayName: "TEST-NO-SUB-ORG" },
    });
    try {
      const result = await checkOrganizationLimit(orphanOrg.id, "PROPERTIES");
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe("noActiveSubscription");
    } finally {
      await prisma.organization.delete({ where: { id: orphanOrg.id } });
    }
  });

  it("hasFeature reflects the real plan flag and flips false once the subscription is suspended", async () => {
    expect(await hasFeature(organizationId, "featureDynamicPricing")).toBe(false);

    await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { featureDynamicPricing: true },
    });
    expect(await hasFeature(organizationId, "featureDynamicPricing")).toBe(true);

    await prisma.subscription.update({ where: { organizationId }, data: { status: "SUSPENDED" } });
    expect(await hasFeature(organizationId, "featureDynamicPricing")).toBe(false);

    // restore for a clean afterAll
    await prisma.subscription.update({ where: { organizationId }, data: { status: "ACTIVE" } });
  });
});
