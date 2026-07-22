"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrganizationAccess, requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getAffiliateSettings } from "./rate";

type ActionResult = { success: true } | { success: false; error: string };

async function getAffiliateForOrg(organizationId: string) {
  return prisma.affiliate.findUniqueOrThrow({ where: { organizationId } });
}

// ---- Campaigns ----

export async function createCampaignAction(
  locale: string,
  organizationId: string,
  input: { name: string; slug: string }
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, ROLE_GROUPS.affiliatePartners);
  const affiliate = await getAffiliateForOrg(organizationId);

  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!input.name.trim() || !slug) return { success: false, error: "invalidInput" };

  const existing = await prisma.campaign.findUnique({
    where: { affiliateId_slug: { affiliateId: affiliate.id, slug } },
  });
  if (existing) return { success: false, error: "slugTaken" };

  await prisma.campaign.create({
    data: { affiliateId: affiliate.id, name: input.name.trim(), slug },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "affiliate.campaign.create",
    entityType: "Campaign",
    metadata: { slug },
  });

  revalidatePath(`/${locale}/dashboard/affiliate/campaigns`);
  return { success: true };
}

export async function toggleCampaignAction(
  locale: string,
  organizationId: string,
  campaignId: string,
  isActive: boolean
): Promise<ActionResult> {
  await requireOrganizationAccess(locale, organizationId, ROLE_GROUPS.affiliatePartners);
  const affiliate = await getAffiliateForOrg(organizationId);

  await prisma.campaign.update({
    where: { id: campaignId, affiliateId: affiliate.id },
    data: { isActive },
  });

  revalidatePath(`/${locale}/dashboard/affiliate/campaigns`);
  return { success: true };
}

// ---- Payout method ----

export async function updatePayoutMethodAction(
  locale: string,
  organizationId: string,
  payoutMethod: { type: "BANK_TRANSFER" | "PAYPAL"; details: string }
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, ROLE_GROUPS.affiliatePartners);
  const affiliate = await getAffiliateForOrg(organizationId);

  await prisma.affiliate.update({
    where: { id: affiliate.id },
    data: { payoutMethod },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "affiliate.payout_method.update",
    entityType: "Affiliate",
    entityId: affiliate.id,
  });

  revalidatePath(`/${locale}/dashboard/affiliate`);
  return { success: true };
}

// ---- Withdrawals ----

export async function requestWithdrawalAction(
  locale: string,
  organizationId: string
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, ROLE_GROUPS.affiliatePartners);
  const affiliate = await getAffiliateForOrg(organizationId);

  if (!affiliate.payoutMethod) {
    return { success: false, error: "noPayoutMethod" };
  }
  const payoutMethodSnapshot = affiliate.payoutMethod;

  const settings = await getAffiliateSettings();
  const minimumWithdrawal = affiliate.minimumWithdrawal
    ? Number(affiliate.minimumWithdrawal)
    : settings.minimumWithdrawal;

  const releasableCommissions = await prisma.commission.findMany({
    where: {
      affiliateId: affiliate.id,
      status: "APPROVED",
      withdrawalId: null,
      holdReleaseAt: { lte: new Date() },
    },
  });

  const totalAmount = releasableCommissions.reduce((sum, c) => sum + Number(c.amount), 0);
  if (totalAmount < minimumWithdrawal) {
    return { success: false, error: "belowMinimumWithdrawal" };
  }
  if (releasableCommissions.length === 0) {
    return { success: false, error: "nothingToWithdraw" };
  }

  const currency = releasableCommissions[0].currency;

  const withdrawal = await prisma.withdrawal.create({
    data: {
      affiliateId: affiliate.id,
      amount: totalAmount,
      currency,
      status: "REQUESTED",
      payoutMethodSnapshot,
    },
  });

  await prisma.commission.updateMany({
    where: { id: { in: releasableCommissions.map((c) => c.id) } },
    data: { withdrawalId: withdrawal.id },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "affiliate.withdrawal.request",
    entityType: "Withdrawal",
    entityId: withdrawal.id,
    metadata: { amount: totalAmount },
  });

  revalidatePath(`/${locale}/dashboard/affiliate/withdrawals`);
  return { success: true };
}

// ---- Super Admin controls ----

export async function approveCommissionAction(locale: string, commissionId: string) {
  const admin = await requireRole(locale, ROLE_GROUPS.platformStaff);
  const commission = await prisma.commission.findFirst({
    where: { id: commissionId, status: "PENDING" },
  });
  if (!commission) return { success: false, error: "notFound" };

  await prisma.commission.update({ where: { id: commissionId }, data: { status: "APPROVED" } });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.affiliate.commission.approve",
    entityType: "Commission",
    entityId: commissionId,
  });
  revalidatePath(`/${locale}/admin/affiliates`);
  return { success: true };
}

export async function rejectCommissionAction(locale: string, commissionId: string, reason: string) {
  const admin = await requireRole(locale, ROLE_GROUPS.platformStaff);
  await prisma.commission.update({
    where: { id: commissionId },
    data: { status: "REJECTED", rejectionReason: reason },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.affiliate.commission.reject",
    entityType: "Commission",
    entityId: commissionId,
    metadata: { reason },
  });
  revalidatePath(`/${locale}/admin/affiliates`);
  return { success: true };
}

export async function processWithdrawalAction(
  locale: string,
  withdrawalId: string,
  decision: "APPROVED" | "REJECTED" | "PAID",
  rejectionReason?: string
) {
  const admin = await requireRole(locale, ROLE_GROUPS.platformStaff);

  await prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: {
      status: decision,
      processedAt: new Date(),
      processedByUserId: admin.id,
      rejectionReason: decision === "REJECTED" ? (rejectionReason ?? null) : null,
    },
  });

  if (decision === "PAID") {
    await prisma.commission.updateMany({
      where: { withdrawalId },
      data: { status: "PAID" },
    });
  }
  if (decision === "REJECTED") {
    await prisma.commission.updateMany({
      where: { withdrawalId },
      data: { withdrawalId: null },
    });
  }

  await logAudit({
    actorUserId: admin.id,
    action: `admin.affiliate.withdrawal.${decision.toLowerCase()}`,
    entityType: "Withdrawal",
    entityId: withdrawalId,
  });

  revalidatePath(`/${locale}/admin/withdrawals`);
  return { success: true };
}

export async function createAffiliateCommissionRuleAction(
  locale: string,
  input: {
    organizationId: string | null;
    serviceType: "HOTEL" | "CAR";
    type: "PERCENTAGE" | "FIXED";
    value: number;
  }
) {
  const admin = await requireRole(locale, ROLE_GROUPS.platformStaff);
  await prisma.affiliateCommissionRule.create({
    data: {
      organizationId: input.organizationId,
      serviceType: input.serviceType,
      type: input.type,
      value: input.value,
    },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.affiliate_commission_rule.create",
    entityType: "AffiliateCommissionRule",
    metadata: input,
  });
  revalidatePath(`/${locale}/admin/affiliates/commission-rules`);
}

export async function deleteAffiliateCommissionRuleAction(locale: string, ruleId: string) {
  const admin = await requireRole(locale, ROLE_GROUPS.platformStaff);
  await prisma.affiliateCommissionRule.delete({ where: { id: ruleId } });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.affiliate_commission_rule.delete",
    entityType: "AffiliateCommissionRule",
    entityId: ruleId,
  });
  revalidatePath(`/${locale}/admin/affiliates/commission-rules`);
}

export async function updateAffiliateSettingsAction(
  locale: string,
  value: { minimumWithdrawal: number; holdingPeriodDays: number; payoutMethods: string[] }
) {
  const admin = await requireRole(locale, ROLE_GROUPS.platformStaff);
  await prisma.globalSetting.upsert({
    where: { key: "affiliate" },
    update: { value },
    create: { key: "affiliate", value },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.affiliate_settings.update",
    entityType: "GlobalSetting",
    metadata: value,
  });
  revalidatePath(`/${locale}/admin/affiliates/settings`);
}
