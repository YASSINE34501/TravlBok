import "server-only";
import { prisma } from "@/lib/db";
import type { BookingStatus, CurrencyCode, Prisma } from "@/generated/prisma/client";

export type AnalyticsFilters = {
  dateFrom?: string;
  dateTo?: string;
  countryId?: string;
  cityId?: string;
  organizationId?: string;
  hotelId?: string;
  serviceType?: "HOTEL" | "CAR";
  currency?: CurrencyCode;
  subscriptionPlanId?: string;
  bookingStatus?: BookingStatus;
};

type ResolvedRange = { dateFrom: Date; dateTo: Date; days: number };

/** Defaults to the trailing 30 days when the admin hasn't picked a range — an open-ended "all time" window would make occupancy/utilization meaningless (rooms/vehicles idle for the platform's whole lifetime would dilute the rate). */
function resolveRange(filters: AnalyticsFilters): ResolvedRange {
  const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date();
  const dateFrom = filters.dateFrom
    ? new Date(filters.dateFrom)
    : new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);
  const days = Math.max(1, Math.round((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)));
  return { dateFrom, dateTo, days };
}

function buildReservationBaseWhere(
  filters: AnalyticsFilters,
  range: ResolvedRange
): Prisma.ReservationWhereInput {
  const where: Prisma.ReservationWhereInput = {
    createdAt: { gte: range.dateFrom, lt: range.dateTo },
  };
  if (filters.organizationId) where.organizationId = filters.organizationId;
  if (filters.serviceType) where.type = filters.serviceType;
  if (filters.hotelId) where.hotelId = filters.hotelId;
  if (filters.currency) where.currency = filters.currency;
  if (filters.countryId || filters.cityId) {
    const geo = {
      ...(filters.countryId ? { countryId: filters.countryId } : {}),
      ...(filters.cityId ? { cityId: filters.cityId } : {}),
    };
    where.OR = [{ hotelLink: { hotel: geo } }, { carLink: { vehicle: { branch: geo } } }];
  }
  return where;
}

export type AdvancedAnalytics = {
  range: { dateFrom: string; dateTo: string };
  grossBookingValue: number;
  commissionRevenue: number;
  subscriptionRevenue: number;
  affiliateCommissionsTotal: number;
  netRevenue: number;
  totalBookings: number;
  cancellationRatePercent: number;
  affiliateConversionRatePercent: number;
  avgCarRentalDurationDays: number;
  occupancyRatePercent: number;
  adr: number;
  revpar: number;
  carUtilizationPercent: number;
  churnRatePercent: number;
  newSubscriptions: number;
  churnedSubscriptions: number;
  subscriptionGrowthTrend: { month: string; netNew: number }[];
  currencyDistribution: { currency: CurrencyCode; amount: number; count: number }[];
  acquisitionSource: { affiliateAttributed: number; direct: number };
  bookingSourceDistribution: { source: string; count: number }[];
  topDestinations: { cityId: string; cityName: string; bookings: number; revenue: number }[];
  topPartners: { organizationId: string; name: string; bookings: number; revenue: number }[];
  topAffiliates: { affiliateId: string; organizationName: string; commissionTotal: number }[];
};

const CONFIRMED_OR_COMPLETED: BookingStatus[] = ["CONFIRMED", "COMPLETED"];

export async function getAdvancedAnalytics(filters: AnalyticsFilters): Promise<AdvancedAnalytics> {
  const range = resolveRange(filters);
  const base = buildReservationBaseWhere(filters, range);
  const statusFilter = filters.bookingStatus;

  const gbvWhere: Prisma.ReservationWhereInput = {
    ...base,
    status: statusFilter ?? { notIn: ["DRAFT", "CANCELLED"] },
  };
  const confirmedWhere: Prisma.ReservationWhereInput = {
    ...base,
    status: statusFilter ?? { in: CONFIRMED_OR_COMPLETED },
  };

  const [
    gbvAgg,
    confirmedAgg,
    totalBookings,
    cancelledCount,
    totalForCancelRate,
    carDurations,
    affiliateAttributedCount,
    bookingSourceGroups,
    subscriptionRevenueAgg,
    affiliateCommissionsAgg,
    currencyGroups,
    hospitalityMetrics,
    carUtilization,
    subscriptionMetrics,
    topDestinations,
    topPartners,
    topAffiliates,
  ] = await Promise.all([
    prisma.reservation.aggregate({ where: gbvWhere, _sum: { totalAmount: true } }),
    prisma.reservation.aggregate({ where: confirmedWhere, _sum: { commissionAmount: true } }),
    prisma.reservation.count({ where: { ...base, ...(statusFilter ? { status: statusFilter } : {}) } }),
    prisma.reservation.count({ where: { ...base, status: "CANCELLED" } }),
    prisma.reservation.count({ where: base }),
    prisma.reservation.findMany({
      where: { ...confirmedWhere, type: "CAR" },
      select: { pickupAt: true, returnAt: true },
    }),
    prisma.commission.count({ where: { reservation: confirmedWhere } }),
    prisma.reservation.groupBy({
      by: ["bookingSource"],
      where: { ...base, ...(statusFilter ? { status: statusFilter } : {}) },
      _count: { _all: true },
    }),
    prisma.payment.aggregate({
      where: {
        subscriptionId: { not: null },
        status: "PAID",
        createdAt: { gte: range.dateFrom, lt: range.dateTo },
        ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
        ...(filters.currency ? { currency: filters.currency } : {}),
      },
      _sum: { amount: true },
    }),
    prisma.commission.aggregate({
      where: {
        createdAt: { gte: range.dateFrom, lt: range.dateTo },
        status: { in: ["APPROVED", "PAID"] },
      },
      _sum: { amount: true },
    }),
    prisma.payment.groupBy({
      by: ["currency"],
      where: {
        createdAt: { gte: range.dateFrom, lt: range.dateTo },
        ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    getHospitalityMetrics(filters, range),
    getCarUtilization(filters, range),
    getSubscriptionMetrics(filters, range),
    getTopDestinations(base),
    getTopPartners(confirmedWhere),
    getTopAffiliates(range),
  ]);

  const grossBookingValue = Number(gbvAgg._sum.totalAmount ?? 0);
  const commissionRevenue = Number(confirmedAgg._sum.commissionAmount ?? 0);
  const subscriptionRevenue = Number(subscriptionRevenueAgg._sum.amount ?? 0);
  const affiliateCommissionsTotal = Number(affiliateCommissionsAgg._sum.amount ?? 0);

  const avgCarRentalDurationDays =
    carDurations.length > 0
      ? carDurations.reduce((sum, r) => {
          if (!r.pickupAt || !r.returnAt) return sum;
          return sum + (r.returnAt.getTime() - r.pickupAt.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / carDurations.length
      : 0;

  const confirmedOrCompletedCount = await prisma.reservation.count({ where: confirmedWhere });

  return {
    range: { dateFrom: range.dateFrom.toISOString().slice(0, 10), dateTo: range.dateTo.toISOString().slice(0, 10) },
    grossBookingValue,
    commissionRevenue,
    subscriptionRevenue,
    affiliateCommissionsTotal,
    netRevenue: Math.round((commissionRevenue + subscriptionRevenue - affiliateCommissionsTotal) * 100) / 100,
    totalBookings,
    cancellationRatePercent:
      totalForCancelRate > 0 ? Math.round((cancelledCount / totalForCancelRate) * 10000) / 100 : 0,
    affiliateConversionRatePercent:
      confirmedOrCompletedCount > 0
        ? Math.round((affiliateAttributedCount / confirmedOrCompletedCount) * 10000) / 100
        : 0,
    avgCarRentalDurationDays: Math.round(avgCarRentalDurationDays * 100) / 100,
    ...hospitalityMetrics,
    carUtilizationPercent: carUtilization,
    ...subscriptionMetrics,
    currencyDistribution: currencyGroups.map((g) => ({
      currency: g.currency,
      amount: Number(g._sum.amount ?? 0),
      count: g._count._all,
    })),
    acquisitionSource: {
      affiliateAttributed: affiliateAttributedCount,
      direct: Math.max(0, confirmedOrCompletedCount - affiliateAttributedCount),
    },
    bookingSourceDistribution: bookingSourceGroups.map((g) => ({
      source: g.bookingSource,
      count: g._count._all,
    })),
    topDestinations,
    topPartners,
    topAffiliates,
  };
}

async function getHospitalityMetrics(
  filters: AnalyticsFilters,
  range: ResolvedRange
): Promise<{ occupancyRatePercent: number; adr: number; revpar: number }> {
  if (filters.serviceType === "CAR") return { occupancyRatePercent: 0, adr: 0, revpar: 0 };

  const hotels = await prisma.hotel.findMany({
    where: {
      deletedAt: null,
      ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
      ...(filters.hotelId ? { id: filters.hotelId } : {}),
      ...(filters.countryId ? { countryId: filters.countryId } : {}),
      ...(filters.cityId ? { cityId: filters.cityId } : {}),
    },
    select: { id: true },
  });
  const hotelIds = hotels.map((h) => h.id);
  if (hotelIds.length === 0) return { occupancyRatePercent: 0, adr: 0, revpar: 0 };

  const [items, totalRoomInventory] = await Promise.all([
    prisma.reservationRoomItem.findMany({
      where: {
        reservation: {
          hotelId: { in: hotelIds },
          status: { in: CONFIRMED_OR_COMPLETED },
          checkInDate: { gte: range.dateFrom, lt: range.dateTo },
        },
      },
      select: { quantity: true, nights: true, subtotal: true },
    }),
    prisma.roomInventory.count({ where: { hotelId: { in: hotelIds }, isActive: true } }),
  ]);

  const roomNightsSold = items.reduce((sum, i) => sum + i.quantity * i.nights, 0);
  const revenue = items.reduce((sum, i) => sum + Number(i.subtotal), 0);
  const roomNightsAvailable = totalRoomInventory * range.days;

  return {
    occupancyRatePercent:
      roomNightsAvailable > 0 ? Math.round((roomNightsSold / roomNightsAvailable) * 10000) / 100 : 0,
    adr: roomNightsSold > 0 ? Math.round((revenue / roomNightsSold) * 100) / 100 : 0,
    revpar: roomNightsAvailable > 0 ? Math.round((revenue / roomNightsAvailable) * 100) / 100 : 0,
  };
}

async function getCarUtilization(filters: AnalyticsFilters, range: ResolvedRange): Promise<number> {
  if (filters.serviceType === "HOTEL") return 0;

  const vehicles = await prisma.vehicle.findMany({
    where: {
      deletedAt: null,
      ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
      ...(filters.countryId || filters.cityId
        ? {
            branch: {
              ...(filters.countryId ? { countryId: filters.countryId } : {}),
              ...(filters.cityId ? { cityId: filters.cityId } : {}),
            },
          }
        : {}),
    },
    select: { id: true },
  });
  const vehicleIds = vehicles.map((v) => v.id);
  if (vehicleIds.length === 0) return 0;

  const rentals = await prisma.reservation.findMany({
    where: {
      type: "CAR",
      status: { in: CONFIRMED_OR_COMPLETED },
      vehicleId: { in: vehicleIds },
      pickupAt: { gte: range.dateFrom, lt: range.dateTo },
    },
    select: { pickupAt: true, returnAt: true },
  });

  const rentedDays = rentals.reduce((sum, r) => {
    if (!r.pickupAt || !r.returnAt) return sum;
    return sum + Math.max(1, (r.returnAt.getTime() - r.pickupAt.getTime()) / (1000 * 60 * 60 * 24));
  }, 0);

  const availableVehicleDays = vehicleIds.length * range.days;
  return availableVehicleDays > 0
    ? Math.min(100, Math.round((rentedDays / availableVehicleDays) * 10000) / 100)
    : 0;
}

async function getSubscriptionMetrics(
  filters: AnalyticsFilters,
  range: ResolvedRange
): Promise<{
  churnRatePercent: number;
  newSubscriptions: number;
  churnedSubscriptions: number;
  subscriptionGrowthTrend: { month: string; netNew: number }[];
}> {
  const planFilter = filters.subscriptionPlanId ? { planId: filters.subscriptionPlanId } : {};
  const orgFilter = filters.organizationId ? { organizationId: filters.organizationId } : {};

  const [activeAtStart, churnedInPeriod, newSubscriptions] = await Promise.all([
    prisma.subscription.count({
      where: { ...planFilter, ...orgFilter, createdAt: { lt: range.dateFrom } },
    }),
    prisma.subscription.count({
      where: {
        ...planFilter,
        ...orgFilter,
        status: { in: ["CANCELLED", "EXPIRED"] },
        OR: [
          { cancelledAt: { gte: range.dateFrom, lt: range.dateTo } },
          { AND: [{ cancelledAt: null }, { updatedAt: { gte: range.dateFrom, lt: range.dateTo } }] },
        ],
      },
    }),
    prisma.subscription.count({
      where: { ...planFilter, ...orgFilter, createdAt: { gte: range.dateFrom, lt: range.dateTo } },
    }),
  ]);

  const trend: { month: string; netNew: number }[] = [];
  const cursor = new Date(range.dateTo);
  cursor.setDate(1);
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() - i + 1, 1);
    const [added, removed] = await Promise.all([
      prisma.subscription.count({
        where: { ...planFilter, ...orgFilter, createdAt: { gte: monthStart, lt: monthEnd } },
      }),
      prisma.subscription.count({
        where: {
          ...planFilter,
          ...orgFilter,
          status: { in: ["CANCELLED", "EXPIRED"] },
          OR: [
            { cancelledAt: { gte: monthStart, lt: monthEnd } },
            { AND: [{ cancelledAt: null }, { updatedAt: { gte: monthStart, lt: monthEnd } }] },
          ],
        },
      }),
    ]);
    trend.push({ month: monthStart.toISOString().slice(0, 7), netNew: added - removed });
  }

  return {
    churnRatePercent: activeAtStart > 0 ? Math.round((churnedInPeriod / activeAtStart) * 10000) / 100 : 0,
    newSubscriptions,
    churnedSubscriptions: churnedInPeriod,
    subscriptionGrowthTrend: trend,
  };
}

async function getTopDestinations(
  base: Prisma.ReservationWhereInput
): Promise<{ cityId: string; cityName: string; bookings: number; revenue: number }[]> {
  const reservations = await prisma.reservation.findMany({
    where: { ...base, status: { in: CONFIRMED_OR_COMPLETED } },
    select: {
      totalAmount: true,
      hotelLink: { select: { hotel: { select: { cityId: true, city: { select: { name: true } } } } } },
      carLink: {
        select: { vehicle: { select: { branch: { select: { cityId: true, city: { select: { name: true } } } } } } },
      },
    },
  });

  const byCity = new Map<string, { name: string; bookings: number; revenue: number }>();
  for (const r of reservations) {
    const cityId = r.hotelLink?.hotel.cityId ?? r.carLink?.vehicle.branch.cityId ?? null;
    const cityNameJson = r.hotelLink?.hotel.city?.name ?? r.carLink?.vehicle.branch.city?.name ?? null;
    if (!cityId || !cityNameJson) continue;
    const cityName = (cityNameJson as Record<string, string>).en ?? Object.values(cityNameJson)[0] ?? cityId;
    const current = byCity.get(cityId) ?? { name: cityName, bookings: 0, revenue: 0 };
    current.bookings += 1;
    current.revenue += Number(r.totalAmount);
    byCity.set(cityId, current);
  }

  return [...byCity.entries()]
    .map(([cityId, v]) => ({ cityId, cityName: v.name, bookings: v.bookings, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

async function getTopPartners(
  confirmedWhere: Prisma.ReservationWhereInput
): Promise<{ organizationId: string; name: string; bookings: number; revenue: number }[]> {
  const groups = await prisma.reservation.groupBy({
    by: ["organizationId"],
    where: confirmedWhere,
    _sum: { totalAmount: true },
    _count: { _all: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 10,
  });
  const orgIds = groups.map((g) => g.organizationId);
  const organizations = orgIds.length
    ? await prisma.organization.findMany({ where: { id: { in: orgIds } }, select: { id: true, displayName: true } })
    : [];
  const nameById = new Map(organizations.map((o) => [o.id, o.displayName]));

  return groups.map((g) => ({
    organizationId: g.organizationId,
    name: nameById.get(g.organizationId) ?? g.organizationId,
    bookings: g._count._all,
    revenue: Number(g._sum.totalAmount ?? 0),
  }));
}

async function getTopAffiliates(
  range: ResolvedRange
): Promise<{ affiliateId: string; organizationName: string; commissionTotal: number }[]> {
  const groups = await prisma.commission.groupBy({
    by: ["affiliateId"],
    where: { createdAt: { gte: range.dateFrom, lt: range.dateTo }, status: { in: ["APPROVED", "PAID"] } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 10,
  });
  const affiliateIds = groups.map((g) => g.affiliateId);
  const affiliates = affiliateIds.length
    ? await prisma.affiliate.findMany({
        where: { id: { in: affiliateIds } },
        select: { id: true, organization: { select: { displayName: true } } },
      })
    : [];
  const nameById = new Map(affiliates.map((a) => [a.id, a.organization.displayName]));

  return groups.map((g) => ({
    affiliateId: g.affiliateId,
    organizationName: nameById.get(g.affiliateId) ?? g.affiliateId,
    commissionTotal: Number(g._sum.amount ?? 0),
  }));
}
