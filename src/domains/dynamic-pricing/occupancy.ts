import "server-only";
import { prisma } from "@/lib/db";
import { toDateKey } from "@/domains/reservations/pricing";

/**
 * Aggregate occupancy across an entire stay (one figure, not per-night) —
 * used to price a specific booking/preview. Kept separate from
 * computeDailyOccupancy below (which is per-day, for the pricing calendar)
 * to match the same whole-stay-aggregate simplification the marketplace's
 * own overbooking check already makes in reservations/actions.ts.
 */
export async function getStayOccupancy(
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
  availableQuantity: number
): Promise<{ occupancyRatePercent: number; remainingInventory: number }> {
  const overlapping = await prisma.reservation.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      checkInDate: { lt: checkOut },
      checkOutDate: { gt: checkIn },
      roomItems: { some: { roomTypeId } },
    },
    include: { roomItems: { where: { roomTypeId } } },
  });

  const bookedQuantity = overlapping.reduce(
    (sum, r) => sum + r.roomItems.reduce((s, i) => s + i.quantity, 0),
    0
  );

  const occupancyRatePercent =
    availableQuantity > 0 ? Math.min(100, (bookedQuantity / availableQuantity) * 100) : 0;
  const remainingInventory = Math.max(0, availableQuantity - bookedQuantity);

  return { occupancyRatePercent, remainingInventory };
}

export type DailyOccupancy = {
  date: string;
  totalQuantity: number;
  bookedQuantity: number;
  occupancyRatePercent: number;
  remainingInventory: number;
};

/** Per-day occupancy over a date range — powers the pricing calendar / bulk recalculation. */
export async function computeDailyOccupancy(
  roomTypeId: string,
  startDate: Date,
  endDate: Date
): Promise<DailyOccupancy[]> {
  const roomType = await prisma.roomType.findUniqueOrThrow({
    where: { id: roomTypeId },
    include: { availabilityOverrides: { where: { date: { gte: startDate, lt: endDate } } } },
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

  const results: DailyOccupancy[] = [];
  const cursor = new Date(startDate);
  while (cursor < endDate) {
    const dateKey = toDateKey(cursor);
    const override = overrideByDate.get(dateKey);

    const bookedQuantity = overlapping.reduce((sum, r) => {
      if (!r.checkInDate || !r.checkOutDate) return sum;
      if (cursor < r.checkInDate || cursor >= r.checkOutDate) return sum;
      return sum + r.roomItems.reduce((s, i) => s + i.quantity, 0);
    }, 0);

    const totalQuantity = override?.quantityOverride ?? roomType.availableQuantity;
    const remainingInventory = override?.closedForBooking
      ? 0
      : Math.max(0, totalQuantity - bookedQuantity);
    const occupancyRatePercent =
      totalQuantity > 0 ? Math.min(100, (bookedQuantity / totalQuantity) * 100) : 0;

    results.push({
      date: dateKey,
      totalQuantity,
      bookedQuantity,
      occupancyRatePercent,
      remainingInventory,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return results;
}
