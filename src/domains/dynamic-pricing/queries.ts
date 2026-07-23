import "server-only";
import { prisma } from "@/lib/db";

export async function getPricingRulesForOrganization(organizationId: string) {
  return prisma.pricingRule.findMany({
    where: { hotel: { organizationId }, deletedAt: null },
    include: {
      hotel: { select: { id: true, name: true } },
      roomType: { select: { id: true, name: true } },
      createdBy: { select: { firstName: true, lastName: true } },
      approvedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ hotelId: "asc" }, { priority: "asc" }],
  });
}

export async function getPricingRulesPendingApproval(organizationId: string) {
  return prisma.pricingRule.findMany({
    where: { hotel: { organizationId }, deletedAt: null, approvalStatus: "PENDING" },
    include: {
      hotel: { select: { name: true } },
      roomType: { select: { name: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

/** Price history / pricing-calendar data for a room type, most recent first. */
export async function getPriceHistory(roomTypeId: string, startDate: Date, endDate: Date) {
  return prisma.dynamicPriceLog.findMany({
    where: { roomTypeId, date: { gte: startDate, lt: endDate } },
    orderBy: { date: "asc" },
  });
}

/**
 * Revenue comparison / forecast chart data: for each logged night, what the
 * dynamic engine would have charged (finalPrice) vs. the static season/base
 * price (basePrice) it started from — the delta is the engine's estimated
 * revenue impact.
 */
export async function getRevenueComparison(hotelId: string, startDate: Date, endDate: Date) {
  const logs = await prisma.dynamicPriceLog.findMany({
    where: { roomType: { hotelId }, date: { gte: startDate, lt: endDate } },
    include: { roomType: { select: { name: true } } },
    orderBy: { date: "asc" },
  });

  const totalBasePriceAmount = logs.reduce((sum, l) => sum + Number(l.basePrice), 0);
  const totalFinalPriceAmount = logs.reduce((sum, l) => sum + Number(l.finalPrice), 0);

  return {
    logs,
    totalBasePriceAmount,
    totalFinalPriceAmount,
    estimatedImpact: Math.round((totalFinalPriceAmount - totalBasePriceAmount) * 100) / 100,
  };
}

// ---- Super Admin oversight ----

export async function getAllPricingRulesForAdmin() {
  return prisma.pricingRule.findMany({
    where: { deletedAt: null },
    include: {
      hotel: { select: { name: true, organization: { select: { displayName: true } } } },
      roomType: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
