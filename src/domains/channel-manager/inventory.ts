import "server-only";
import { prisma } from "@/lib/db";
import { resolveNightlyPrice } from "@/domains/reservations/pricing";

export type DailyAvailability = {
  date: string; // YYYY-MM-DD
  availableCount: number;
  price: number;
  closed: boolean;
  minStay: number;
  maxStay: number | null;
};

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * The single source of truth for "how many rooms of this type are free on
 * this date" — reused for both the channel-manager PUSH sync (this file)
 * and, transitively via the same RoomType/RoomAvailabilityOverride/
 * ReservationRoomItem tables, by the marketplace's own overlap check
 * (src/domains/hotels/availability.ts, src/domains/reservations/actions.ts).
 * Because a channel-imported Reservation is a normal row in the same
 * ReservationRoomItem ledger, it is automatically subtracted here too —
 * this *is* the "centralized inventory locking" MASTER-PLAN asks for:
 * one ledger, not a separate per-channel counter that can drift.
 */
export async function computeDailyAvailability(
  roomTypeId: string,
  startDate: Date,
  endDate: Date
): Promise<DailyAvailability[]> {
  const roomType = await prisma.roomType.findUniqueOrThrow({
    where: { id: roomTypeId },
    include: {
      seasonalPrices: true,
      availabilityOverrides: { where: { date: { gte: startDate, lt: endDate } } },
    },
  });

  const overlapping = await prisma.reservation.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      checkInDate: { lt: endDate },
      checkOutDate: { gt: startDate },
      roomItems: { some: { roomTypeId } },
    },
    include: { roomItems: { where: { roomTypeId } } },
  });

  const overrideByDate = new Map(
    roomType.availabilityOverrides.map((o) => [toDateKey(o.date), o])
  );

  const results: DailyAvailability[] = [];
  const cursor = new Date(startDate);
  while (cursor < endDate) {
    const dateKey = toDateKey(cursor);
    const override = overrideByDate.get(dateKey);

    const bookedQuantity = overlapping.reduce((sum, reservation) => {
      if (!reservation.checkInDate || !reservation.checkOutDate) return sum;
      if (cursor < reservation.checkInDate || cursor >= reservation.checkOutDate) return sum;
      return sum + reservation.roomItems.reduce((s, item) => s + item.quantity, 0);
    }, 0);

    const totalQuantity = override?.quantityOverride ?? roomType.availableQuantity;
    const availableCount = override?.closedForBooking
      ? 0
      : Math.max(0, totalQuantity - bookedQuantity);

    const price = resolveNightlyPrice(
      cursor,
      Number(roomType.basePrice),
      roomType.weekendPrice ? Number(roomType.weekendPrice) : null,
      roomType.seasonalPrices.map((s) => ({
        startDate: s.startDate,
        endDate: s.endDate,
        price: Number(s.price),
        weekendPrice: s.weekendPrice ? Number(s.weekendPrice) : null,
      })),
      roomType.availabilityOverrides.map((o) => ({
        date: o.date,
        priceOverride: o.priceOverride ? Number(o.priceOverride) : null,
        closedForBooking: o.closedForBooking,
      }))
    );

    results.push({
      date: dateKey,
      availableCount,
      price,
      closed: override?.closedForBooking ?? false,
      minStay: roomType.minStay,
      maxStay: roomType.maxStay,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return results;
}
