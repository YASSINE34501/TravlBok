import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { getAffiliateCommissionRate } from "@/domains/affiliates/rate";

describe("affiliate commission rate resolution (real getAffiliateCommissionRate, real DB)", () => {
  let organizationId: string;
  const createdRuleIds: string[] = [];

  beforeAll(async () => {
    const org = await prisma.organization.create({
      data: { type: "HOTEL", legalName: "TEST-COMMISSION-ORG", displayName: "TEST-COMMISSION-ORG" },
    });
    organizationId = org.id;
  });

  afterAll(async () => {
    await prisma.affiliateCommissionRule.deleteMany({ where: { id: { in: createdRuleIds } } });
    await prisma.organization.delete({ where: { id: organizationId } });
  });

  it("falls back to the hardcoded 5% platform default when no rule exists at all", async () => {
    const rate = await getAffiliateCommissionRate(organizationId, "HOTEL");
    expect(rate).toBe(0.05);
  });

  it("uses the platform-wide default rule (organizationId: null) when no org-specific rule exists", async () => {
    const platformRule = await prisma.affiliateCommissionRule.create({
      data: { organizationId: null, serviceType: "HOTEL", type: "PERCENTAGE", value: 8 },
    });
    createdRuleIds.push(platformRule.id);

    const rate = await getAffiliateCommissionRate(organizationId, "HOTEL");
    expect(rate).toBe(0.08);
  });

  it("prefers an organization-specific rule over the platform-wide default", async () => {
    const orgRule = await prisma.affiliateCommissionRule.create({
      data: { organizationId, serviceType: "HOTEL", type: "PERCENTAGE", value: 12 },
    });
    createdRuleIds.push(orgRule.id);

    const rate = await getAffiliateCommissionRate(organizationId, "HOTEL");
    expect(rate).toBe(0.12);
  });

  it("resolves a FIXED rule type as a flat amount, not a percentage", async () => {
    const fixedRule = await prisma.affiliateCommissionRule.create({
      data: { organizationId, serviceType: "CAR", type: "FIXED", value: 50 },
    });
    createdRuleIds.push(fixedRule.id);

    const rate = await getAffiliateCommissionRate(organizationId, "CAR");
    expect(rate).toBe(50);
  });

  it("keeps HOTEL and CAR service-type rates independent", async () => {
    const hotelRate = await getAffiliateCommissionRate(organizationId, "HOTEL");
    const carRate = await getAffiliateCommissionRate(organizationId, "CAR");
    expect(hotelRate).toBe(0.12);
    expect(carRate).toBe(50);
  });
});
