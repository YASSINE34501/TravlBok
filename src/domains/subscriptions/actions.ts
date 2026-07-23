"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrganizationAccess, requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { notifyOrganizationOwners } from "@/domains/notifications/service";

type ActionResult = { success: true } | { success: false; error: string };

const USAGE_METRICS = [
  { metric: "PROPERTIES" as const, planField: "maxProperties" as const },
  { metric: "VEHICLES" as const, planField: "maxVehicles" as const },
  { metric: "BRANCHES" as const, planField: "maxBranches" as const },
  { metric: "STAFF" as const, planField: "maxStaff" as const },
];

async function countUsage(organizationId: string, metric: (typeof USAGE_METRICS)[number]["metric"]) {
  switch (metric) {
    case "PROPERTIES":
      return prisma.hotel.count({ where: { organizationId, deletedAt: null } });
    case "VEHICLES":
      return prisma.vehicle.count({ where: { organizationId, deletedAt: null } });
    case "BRANCHES":
      return prisma.carBranch.count({ where: { organizationId, deletedAt: null } });
    case "STAFF":
      return prisma.organizationMember.count({
        where: { organizationId, status: { in: ["ACTIVE", "INVITED"] } },
      });
  }
}

export async function changePlanAction(
  locale: string,
  organizationId: string,
  input: { planId: string; billingInterval: "MONTHLY" | "ANNUAL" }
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, ROLE_GROUPS.partnerOwners);

  const [subscription, targetPlan] = await Promise.all([
    prisma.subscription.findUnique({ where: { organizationId } }),
    prisma.subscriptionPlan.findUnique({ where: { id: input.planId } }),
  ]);
  if (!subscription || !targetPlan || targetPlan.isArchived) {
    return { success: false, error: "invalidInput" };
  }

  for (const { metric, planField } of USAGE_METRICS) {
    const limit = targetPlan[planField];
    if (limit === null) continue;
    const current = await countUsage(organizationId, metric);
    if (current > limit) {
      return { success: false, error: "usageExceedsTargetPlan" };
    }
  }

  const now = new Date();
  const periodEnd = new Date(now);
  if (input.billingInterval === "ANNUAL") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  await prisma.subscription.update({
    where: { organizationId },
    data: {
      planId: targetPlan.id,
      billingInterval: input.billingInterval,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      cancelledAt: null,
    },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "subscription.change_plan",
    entityType: "Subscription",
    metadata: { planId: targetPlan.id, billingInterval: input.billingInterval },
  });

  revalidatePath(`/${locale}/dashboard/subscription`);
  return { success: true };
}

export async function cancelSubscriptionAction(
  locale: string,
  organizationId: string
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, ROLE_GROUPS.partnerOwners);

  await prisma.subscription.update({
    where: { organizationId },
    data: { cancelAtPeriodEnd: true, cancelledAt: new Date() },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "subscription.cancel",
    entityType: "Subscription",
  });

  revalidatePath(`/${locale}/dashboard/subscription`);
  return { success: true };
}

export async function renewSubscriptionAction(
  locale: string,
  organizationId: string
): Promise<ActionResult> {
  const admin = await requireRole(locale, ROLE_GROUPS.platformStaff);

  const subscription = await prisma.subscription.findUnique({ where: { organizationId } });
  if (!subscription) return { success: false, error: "notFound" };

  const now = new Date();
  const periodEnd = new Date(now);
  if (subscription.billingInterval === "ANNUAL") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  await prisma.subscription.update({
    where: { organizationId },
    data: {
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      gracePeriodEndsAt: null,
    },
  });

  await logAudit({
    actorUserId: admin.id,
    organizationId,
    action: "subscription.renew",
    entityType: "Subscription",
  });

  revalidatePath(`/${locale}/admin/subscriptions`);
  return { success: true };
}

// ---- Super Admin: plan management + manual assignment ----

export async function createSubscriptionPlanAction(
  locale: string,
  input: {
    tier: "FREE" | "STARTER" | "PROFESSIONAL" | "BUSINESS" | "ENTERPRISE";
    nameEn: string;
    nameFr: string;
    nameAr: string;
    monthlyPrice: number;
    annualPrice: number;
    trialDays: number;
    maxProperties: number | null;
    maxRoomsPerProperty: number | null;
    maxVehicles: number | null;
    maxBranches: number | null;
    maxStaff: number | null;
    maxMonthlyBookings: number | null;
    featureAnalytics: boolean;
    featurePms: boolean;
    featureChannelManager: boolean;
    featureDynamicPricing: boolean;
    featureApiAccess: boolean;
    featureAffiliateTools: boolean;
    featurePrioritySupport: boolean;
    featureCustomCommissionRates: boolean;
  }
) {
  const admin = await requireRole(locale, ROLE_GROUPS.platformStaff);

  const plan = await prisma.subscriptionPlan.create({
    data: {
      tier: input.tier,
      name: { en: input.nameEn, fr: input.nameFr, ar: input.nameAr },
      monthlyPrice: input.monthlyPrice,
      annualPrice: input.annualPrice,
      trialDays: input.trialDays,
      maxProperties: input.maxProperties,
      maxRoomsPerProperty: input.maxRoomsPerProperty,
      maxVehicles: input.maxVehicles,
      maxBranches: input.maxBranches,
      maxStaff: input.maxStaff,
      maxMonthlyBookings: input.maxMonthlyBookings,
      featureAnalytics: input.featureAnalytics,
      featurePms: input.featurePms,
      featureChannelManager: input.featureChannelManager,
      featureDynamicPricing: input.featureDynamicPricing,
      featureApiAccess: input.featureApiAccess,
      featureAffiliateTools: input.featureAffiliateTools,
      featurePrioritySupport: input.featurePrioritySupport,
      featureCustomCommissionRates: input.featureCustomCommissionRates,
    },
  });

  await logAudit({
    actorUserId: admin.id,
    action: "admin.subscription_plan.create",
    entityType: "SubscriptionPlan",
    entityId: plan.id,
  });

  revalidatePath(`/${locale}/admin/subscription-plans`);
}

export async function toggleSubscriptionPlanArchivedAction(
  locale: string,
  planId: string,
  isArchived: boolean
) {
  const admin = await requireRole(locale, ROLE_GROUPS.platformStaff);
  await prisma.subscriptionPlan.update({ where: { id: planId }, data: { isArchived } });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.subscription_plan.archive",
    entityType: "SubscriptionPlan",
    entityId: planId,
    metadata: { isArchived },
  });
  revalidatePath(`/${locale}/admin/subscription-plans`);
}

export async function assignSubscriptionAction(
  locale: string,
  organizationId: string,
  planId: string
): Promise<ActionResult> {
  const admin = await requireRole(locale, ROLE_GROUPS.platformStaff);

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await prisma.subscription.upsert({
    where: { organizationId },
    update: { planId, status: "ACTIVE", currentPeriodStart: now, currentPeriodEnd: periodEnd },
    create: {
      organizationId,
      planId,
      status: "ACTIVE",
      billingInterval: "MONTHLY",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  await logAudit({
    actorUserId: admin.id,
    organizationId,
    action: "admin.subscription.assign",
    entityType: "Subscription",
    metadata: { planId },
  });

  await notifyOrganizationOwners(organizationId, {
    type: "subscription_plan_assigned",
    title: "Subscription plan updated",
    message: "TravlBok has assigned a new subscription plan to your organization.",
    metadata: { planId },
    channels: ["IN_APP", "EMAIL"],
  });

  revalidatePath(`/${locale}/admin/subscriptions`);
  return { success: true };
}

export async function suspendSubscriptionAction(
  locale: string,
  organizationId: string
): Promise<ActionResult> {
  const admin = await requireRole(locale, ROLE_GROUPS.platformStaff);
  await prisma.subscription.update({
    where: { organizationId },
    data: { status: "SUSPENDED" },
  });
  await logAudit({
    actorUserId: admin.id,
    organizationId,
    action: "admin.subscription.suspend",
    entityType: "Subscription",
  });
  await notifyOrganizationOwners(organizationId, {
    type: "subscription_suspended",
    title: "Subscription suspended",
    message: "Your subscription has been suspended by TravlBok. Contact support for details.",
    channels: ["IN_APP", "EMAIL"],
  });
  revalidatePath(`/${locale}/admin/subscriptions`);
  return { success: true };
}
