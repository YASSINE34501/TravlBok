import "server-only";
import { prisma } from "@/lib/db";

export type LimitCheck =
  | { allowed: true }
  | {
      allowed: false;
      reason: "noActiveSubscription" | "subscriptionSuspended" | "planLimitReached";
      limit?: number;
      current?: number;
    };

type CountableMetric =
  | "PROPERTIES"
  | "ROOMS_PER_PROPERTY"
  | "VEHICLES"
  | "BRANCHES"
  | "STAFF"
  | "MONTHLY_BOOKINGS";

const PLAN_LIMIT_FIELD: Record<CountableMetric, string> = {
  PROPERTIES: "maxProperties",
  ROOMS_PER_PROPERTY: "maxRoomsPerProperty",
  VEHICLES: "maxVehicles",
  BRANCHES: "maxBranches",
  STAFF: "maxStaff",
  MONTHLY_BOOKINGS: "maxMonthlyBookings",
};

async function getActiveSubscription(organizationId: string) {
  return prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });
}

async function countCurrentUsage(
  organizationId: string,
  metric: CountableMetric,
  context?: { hotelId?: string }
): Promise<number> {
  switch (metric) {
    case "PROPERTIES":
      return prisma.hotel.count({ where: { organizationId, deletedAt: null } });
    case "ROOMS_PER_PROPERTY":
      return prisma.roomType.count({
        where: { hotelId: context?.hotelId, deletedAt: null, isActive: true },
      });
    case "VEHICLES":
      return prisma.vehicle.count({ where: { organizationId, deletedAt: null } });
    case "BRANCHES":
      return prisma.carBranch.count({ where: { organizationId, deletedAt: null } });
    case "STAFF":
      return prisma.organizationMember.count({
        where: { organizationId, status: { in: ["ACTIVE", "INVITED"] } },
      });
    case "MONTHLY_BOOKINGS": {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      return prisma.reservation.count({
        where: { organizationId, createdAt: { gte: startOfMonth } },
      });
    }
  }
}

/**
 * Live re-count against the real tables on every call — UsageRecord is an
 * append-only snapshot log for reporting only, never trusted as the source
 * of truth for a limit decision (avoids drift between the log and reality).
 */
export async function checkOrganizationLimit(
  organizationId: string,
  metric: CountableMetric,
  context?: { hotelId?: string }
): Promise<LimitCheck> {
  const subscription = await getActiveSubscription(organizationId);
  if (!subscription) {
    return { allowed: false, reason: "noActiveSubscription" };
  }
  if (subscription.status === "SUSPENDED" || subscription.status === "EXPIRED") {
    return { allowed: false, reason: "subscriptionSuspended" };
  }

  const limit = subscription.plan[PLAN_LIMIT_FIELD[metric] as keyof typeof subscription.plan] as
    | number
    | null;
  if (limit === null || limit === undefined) {
    return { allowed: true };
  }

  const current = await countCurrentUsage(organizationId, metric, context);
  if (current >= limit) {
    return { allowed: false, reason: "planLimitReached", limit, current };
  }
  return { allowed: true };
}

type FeatureFlag =
  | "featureAnalytics"
  | "featurePms"
  | "featureChannelManager"
  | "featureDynamicPricing"
  | "featureApiAccess"
  | "featureAffiliateTools"
  | "featurePrioritySupport"
  | "featureCustomCommissionRates";

export async function hasFeature(organizationId: string, flag: FeatureFlag): Promise<boolean> {
  const subscription = await getActiveSubscription(organizationId);
  if (!subscription) return false;
  if (subscription.status === "SUSPENDED" || subscription.status === "EXPIRED") return false;
  return subscription.plan[flag];
}
