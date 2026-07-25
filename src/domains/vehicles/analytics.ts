import "server-only";
import { prisma } from "@/lib/db";
import type { DashboardSeriesPoint, RecentReservationRow } from "@/domains/hotels/analytics";

export type CarRentalDashboardOverview = {
  revenuePeriod: number;
  bookingCount: number;
  fleetSize: number;
  activeRentalsToday: number;
  pickupsToday: number;
  returnsToday: number;
  averageRating: number | null;
  reviewCount: number;
  series: DashboardSeriesPoint[];
  paymentStatusBreakdown: { status: string; count: number }[];
  recentReservations: RecentReservationRow[];
};

/** Dashboard-overview aggregate for a CAR_RENTAL organization. */
export async function getCarRentalDashboardOverview(
  organizationId: string,
  days = 14
): Promise<CarRentalDashboardOverview> {
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));
  const todayEnd = new Date(endDate);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [
    fleetSize,
    bookingCount,
    activeRentalsToday,
    pickupsToday,
    returnsToday,
    ratingAgg,
    paymentGroups,
    periodReservations,
    recentReservations,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { organizationId, deletedAt: null } }),
    prisma.reservation.count({
      where: { organizationId, status: { in: ["CONFIRMED", "COMPLETED"] } },
    }),
    prisma.reservation.count({
      where: {
        organizationId,
        status: "CONFIRMED",
        pickupAt: { lt: todayEnd },
        returnAt: { gte: endDate },
      },
    }),
    prisma.reservation.count({
      where: { organizationId, pickupAt: { gte: endDate, lt: todayEnd } },
    }),
    prisma.reservation.count({
      where: { organizationId, returnAt: { gte: endDate, lt: todayEnd } },
    }),
    prisma.review.aggregate({
      where: { vehicle: { organizationId }, status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.reservation.groupBy({
      by: ["paymentStatus"],
      where: { organizationId },
      _count: true,
    }),
    prisma.reservation.findMany({
      where: {
        organizationId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
        pickupAt: { gte: startDate, lt: todayEnd },
      },
      select: { pickupAt: true, totalAmount: true },
    }),
    prisma.reservation.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        carLink: { include: { vehicle: { select: { brand: true, model: true } } } },
      },
    }),
  ]);

  const seriesMap = new Map<string, DashboardSeriesPoint>();
  for (const reservation of periodReservations) {
    if (!reservation.pickupAt) continue;
    const day = reservation.pickupAt.toISOString().slice(0, 10);
    const entry = seriesMap.get(day) ?? { day, revenue: 0, bookings: 0 };
    entry.revenue += Number(reservation.totalAmount);
    entry.bookings += 1;
    seriesMap.set(day, entry);
  }
  const series = Array.from(seriesMap.values()).sort((a, b) => a.day.localeCompare(b.day));
  const revenuePeriod = series.reduce((sum, point) => sum + point.revenue, 0);

  return {
    revenuePeriod,
    bookingCount,
    fleetSize,
    activeRentalsToday,
    pickupsToday,
    returnsToday,
    averageRating: ratingAgg._avg.rating,
    reviewCount: ratingAgg._count,
    series,
    paymentStatusBreakdown: paymentGroups.map((g) => ({
      status: g.paymentStatus,
      count: g._count,
    })),
    recentReservations: recentReservations.map((r) => ({
      id: r.id,
      bookingReference: r.bookingReference,
      guestName: `${r.guestFirstName} ${r.guestLastName}`,
      propertyName: r.carLink ? `${r.carLink.vehicle.brand} ${r.carLink.vehicle.model}` : "",
      totalAmount: Number(r.totalAmount),
      currency: r.currency,
      status: r.status,
      createdAt: r.createdAt,
    })),
  };
}
