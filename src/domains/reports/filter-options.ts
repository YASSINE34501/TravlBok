import "server-only";
import { prisma } from "@/lib/db";

export async function getAnalyticsFilterOptions() {
  const [countries, cities, organizations, hotels, subscriptionPlans] = await Promise.all([
    prisma.country.findMany({ orderBy: { name: "asc" } }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.organization.findMany({
      where: { deletedAt: null },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.hotel.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.subscriptionPlan.findMany({
      where: { isArchived: false },
      select: { id: true, tier: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return { countries, cities, organizations, hotels, subscriptionPlans };
}
