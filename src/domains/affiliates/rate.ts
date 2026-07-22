import "server-only";
import { prisma } from "@/lib/db";
import type { ReservationType } from "@/generated/prisma/client";

/**
 * Deliberately a separate table/function from src/domains/reservations/coupons.ts's
 * getCommissionRate: that one is the platform's cut from the *partner*.
 * This is the affiliate's payout rate for referring a booking to that same
 * partner — a different business concept that must not share a table.
 */
export async function getAffiliateCommissionRate(
  organizationId: string,
  serviceType: ReservationType
): Promise<number> {
  const orgRule = await prisma.affiliateCommissionRule.findFirst({
    where: { organizationId, serviceType },
    orderBy: { createdAt: "desc" },
  });
  const rule =
    orgRule ??
    (await prisma.affiliateCommissionRule.findFirst({
      where: { organizationId: null, serviceType },
      orderBy: { createdAt: "desc" },
    }));

  if (!rule) return 0.05; // sensible platform default: 5%
  return rule.type === "PERCENTAGE" ? Number(rule.value) / 100 : Number(rule.value);
}

export type AffiliateSettings = {
  minimumWithdrawal: number;
  holdingPeriodDays: number;
  payoutMethods: string[];
};

const DEFAULT_AFFILIATE_SETTINGS: AffiliateSettings = {
  minimumWithdrawal: 500,
  holdingPeriodDays: 14,
  payoutMethods: ["BANK_TRANSFER", "PAYPAL"],
};

export async function getAffiliateSettings(): Promise<AffiliateSettings> {
  const setting = await prisma.globalSetting.findUnique({ where: { key: "affiliate" } });
  if (!setting) return DEFAULT_AFFILIATE_SETTINGS;
  return { ...DEFAULT_AFFILIATE_SETTINGS, ...(setting.value as Partial<AffiliateSettings>) };
}
