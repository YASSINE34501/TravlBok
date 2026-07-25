import "server-only";
import { prisma } from "@/lib/db";
import { getOccupancyReport } from "@/domains/pms/reports";
import type { CurrencyCode } from "@/lib/currency/config";

export type PropertyComparisonRow = {
  hotelId: string;
  name: string;
  roomTypeCount: number;
  bookingCount: number;
  revenue: number;
  nightsSold: number;
  adr: number;
  averageRating: number | null;
};

/**
 * "Consolidated revenue" + "Property comparison" for a hotel group —
 * revenue sums raw `Reservation.totalAmount` for CONFIRMED/COMPLETED
 * bookings without cross-currency conversion (organization base-currency
 * assumed), the same simplification `branches/queries.ts` documents for car
 * rental branch revenue.
 */
export async function getPropertyComparison(organizationId: string): Promise<PropertyComparisonRow[]> {
  const hotels = await prisma.hotel.findMany({
    where: { organizationId, deletedAt: null },
    include: { roomTypes: { where: { deletedAt: null }, select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });
  const hotelIds = hotels.map((h) => h.id);
  if (hotelIds.length === 0) return [];

  const [links, reviews] = await Promise.all([
    prisma.hotelReservationLink.findMany({
      where: { hotelId: { in: hotelIds }, reservation: { status: { in: ["CONFIRMED", "COMPLETED"] } } },
      include: {
        reservation: {
          select: { totalAmount: true, roomItems: { select: { nights: true, quantity: true } } },
        },
      },
    }),
    prisma.review.groupBy({
      by: ["hotelId"],
      where: { hotelId: { in: hotelIds }, status: "APPROVED" },
      _avg: { rating: true },
    }),
  ]);

  const ratingByHotel = new Map(reviews.map((r) => [r.hotelId as string, r._avg.rating]));

  const statsByHotel = new Map<string, { revenue: number; bookingCount: number; nightsSold: number }>();
  for (const link of links) {
    const current = statsByHotel.get(link.hotelId) ?? { revenue: 0, bookingCount: 0, nightsSold: 0 };
    current.revenue += Number(link.reservation.totalAmount);
    current.bookingCount += 1;
    current.nightsSold += link.reservation.roomItems.reduce((s, i) => s + i.nights * i.quantity, 0);
    statsByHotel.set(link.hotelId, current);
  }

  return hotels.map((hotel) => {
    const stats = statsByHotel.get(hotel.id) ?? { revenue: 0, bookingCount: 0, nightsSold: 0 };
    return {
      hotelId: hotel.id,
      name: hotel.name,
      roomTypeCount: hotel.roomTypes.length,
      bookingCount: stats.bookingCount,
      revenue: stats.revenue,
      nightsSold: stats.nightsSold,
      adr: stats.nightsSold > 0 ? Math.round((stats.revenue / stats.nightsSold) * 100) / 100 : 0,
      averageRating: ratingByHotel.get(hotel.id) ?? null,
    };
  });
}

export type DashboardSeriesPoint = { day: string; revenue: number; bookings: number };

export type RecentReservationRow = {
  id: string;
  bookingReference: string;
  guestName: string;
  propertyName: string;
  totalAmount: number;
  currency: CurrencyCode;
  status: string;
  createdAt: Date;
};

export type HotelDashboardOverview = {
  revenuePeriod: number;
  bookingCount: number;
  occupancyPercent: number;
  arrivalsToday: number;
  departuresToday: number;
  averageRating: number | null;
  reviewCount: number;
  series: DashboardSeriesPoint[];
  paymentStatusBreakdown: { status: string; count: number }[];
  recentReservations: RecentReservationRow[];
};

/**
 * Dashboard-overview aggregate for a HOTEL organization — merges per-hotel
 * `getOccupancyReport` (existing PMS reporting query, reused rather than
 * reimplemented) across every property the org owns, day-by-day, since an
 * organization can own more than one hotel (multi-property, Phase 3).
 */
export async function getHotelDashboardOverview(
  organizationId: string,
  days = 14
): Promise<HotelDashboardOverview> {
  const hotels = await prisma.hotel.findMany({
    where: { organizationId, deletedAt: null },
    select: { id: true },
  });
  const hotelIds = hotels.map((h) => h.id);

  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));
  const todayEnd = new Date(endDate);
  todayEnd.setDate(todayEnd.getDate() + 1);

  if (hotelIds.length === 0) {
    return {
      revenuePeriod: 0,
      bookingCount: 0,
      occupancyPercent: 0,
      arrivalsToday: 0,
      departuresToday: 0,
      averageRating: null,
      reviewCount: 0,
      series: [],
      paymentStatusBreakdown: [],
      recentReservations: [],
    };
  }

  const [
    occupancyRowsByHotel,
    totalRooms,
    bookingCount,
    arrivalsToday,
    departuresToday,
    ratingAgg,
    paymentGroups,
    recentReservations,
  ] = await Promise.all([
    Promise.all(hotelIds.map((id) => getOccupancyReport(id, startDate, endDate))),
    prisma.roomInventory.count({ where: { hotelId: { in: hotelIds }, isActive: true } }),
    prisma.reservation.count({
      where: { organizationId, status: { in: ["CONFIRMED", "COMPLETED"] } },
    }),
    prisma.reservation.count({
      where: { hotelId: { in: hotelIds }, checkInDate: { gte: endDate, lt: todayEnd } },
    }),
    prisma.reservation.count({
      where: { hotelId: { in: hotelIds }, checkOutDate: { gte: endDate, lt: todayEnd } },
    }),
    prisma.review.aggregate({
      where: { hotelId: { in: hotelIds }, status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.reservation.groupBy({
      by: ["paymentStatus"],
      where: { organizationId },
      _count: true,
    }),
    prisma.reservation.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        hotelLink: { include: { hotel: { select: { name: true } } } },
        carLink: { include: { vehicle: { select: { brand: true, model: true } } } },
      },
    }),
  ]);

  const seriesMap = new Map<string, DashboardSeriesPoint>();
  for (const rows of occupancyRowsByHotel) {
    for (const row of rows) {
      const entry = seriesMap.get(row.day) ?? { day: row.day, revenue: 0, bookings: 0 };
      entry.revenue += row.revenue;
      entry.bookings += row.roomsSold;
      seriesMap.set(row.day, entry);
    }
  }
  const series = Array.from(seriesMap.values()).sort((a, b) => a.day.localeCompare(b.day));
  const revenuePeriod = series.reduce((sum, point) => sum + point.revenue, 0);
  const roomsSoldToday = series.at(-1)?.bookings ?? 0;

  return {
    revenuePeriod,
    bookingCount,
    occupancyPercent: totalRooms > 0 ? (roomsSoldToday / totalRooms) * 100 : 0,
    arrivalsToday,
    departuresToday,
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
      propertyName: r.hotelLink?.hotel.name ?? "",
      totalAmount: Number(r.totalAmount),
      currency: r.currency,
      status: r.status,
      createdAt: r.createdAt,
    })),
  };
}
