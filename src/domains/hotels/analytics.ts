import "server-only";
import { prisma } from "@/lib/db";

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
