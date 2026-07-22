import "server-only";
import { prisma } from "@/lib/db";

/**
 * Read-only counterpart of the overlap/quantity check performed inside
 * createHotelReservationAction's transaction. Used by search to exclude room
 * types that can't actually accommodate the requested dates/quantity — kept
 * separate from the transactional booking check so search stays a plain read.
 */
export async function getUnavailableRoomTypeIds(
  checkIn: Date,
  checkOut: Date,
  quantity: number,
  candidateRoomTypeIds: string[]
): Promise<Set<string>> {
  if (candidateRoomTypeIds.length === 0) return new Set();

  const [roomTypes, closedOverrides, overlapping] = await Promise.all([
    prisma.roomType.findMany({
      where: { id: { in: candidateRoomTypeIds } },
      select: { id: true, availableQuantity: true },
    }),
    prisma.roomAvailabilityOverride.findMany({
      where: {
        roomTypeId: { in: candidateRoomTypeIds },
        date: { gte: checkIn, lt: checkOut },
        closedForBooking: true,
      },
      select: { roomTypeId: true },
    }),
    prisma.reservation.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
        roomItems: { some: { roomTypeId: { in: candidateRoomTypeIds } } },
      },
      include: { roomItems: { where: { roomTypeId: { in: candidateRoomTypeIds } } } },
    }),
  ]);

  const bookedByRoomType = new Map<string, number>();
  for (const reservation of overlapping) {
    for (const item of reservation.roomItems) {
      bookedByRoomType.set(
        item.roomTypeId,
        (bookedByRoomType.get(item.roomTypeId) ?? 0) + item.quantity
      );
    }
  }

  const closedRoomTypeIds = new Set(closedOverrides.map((o) => o.roomTypeId));

  const unavailable = new Set<string>();
  for (const roomType of roomTypes) {
    if (closedRoomTypeIds.has(roomType.id)) {
      unavailable.add(roomType.id);
      continue;
    }
    const booked = bookedByRoomType.get(roomType.id) ?? 0;
    if (booked + quantity > roomType.availableQuantity) {
      unavailable.add(roomType.id);
    }
  }

  return unavailable;
}
