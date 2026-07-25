import "server-only";
import { prisma } from "@/lib/db";

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfToday(): Date {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}

export async function getFrontDeskData(hotelId: string) {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const [arrivals, departures, currentGuests, roomInventory, pendingPayments, noShows] =
    await Promise.all([
      prisma.reservation.findMany({
        where: {
          hotelId,
          checkInDate: { gte: todayStart, lt: todayEnd },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        include: { checkIn: true },
      }),
      prisma.checkIn.findMany({
        where: {
          roomInventory: { hotelId },
          reservation: { checkOutDate: { gte: todayStart, lt: todayEnd } },
          checkOut: null,
        },
        include: { reservation: true, roomInventory: true },
      }),
      prisma.checkIn.findMany({
        where: { roomInventory: { hotelId }, checkOut: null },
        include: { reservation: true, roomInventory: true, guestProfile: true },
      }),
      prisma.roomInventory.findMany({
        where: { hotelId, isActive: true },
        include: { roomType: { select: { name: true } } },
        orderBy: { unitNumber: "asc" },
      }),
      prisma.payment.findMany({
        where: { reservation: { hotelId }, status: { in: ["PENDING", "AUTHORIZED"] } },
        include: { reservation: true },
      }),
      prisma.reservation.findMany({
        where: {
          hotelId,
          checkInDate: { lt: todayStart },
          status: "PENDING",
        },
      }),
    ]);

  const roomsByStatus = roomInventory.reduce<Record<string, number>>((acc, room) => {
    acc[room.operationalStatus] = (acc[room.operationalStatus] ?? 0) + 1;
    return acc;
  }, {});

  return {
    arrivals,
    departures,
    currentGuests,
    roomInventory,
    roomsByStatus,
    pendingPayments,
    noShows,
  };
}

export async function getHousekeepingTasks(hotelId: string) {
  return prisma.housekeepingTask.findMany({
    where: { hotelId },
    include: { roomInventory: { select: { unitNumber: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function getMaintenanceTasks(hotelId: string) {
  return prisma.maintenanceTask.findMany({
    where: { hotelId },
    include: { roomInventory: { select: { unitNumber: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export type RoomRackDay = {
  date: string;
  occupied: boolean;
  guestName?: string;
  bookingReference?: string;
};

export type RoomRackRow = {
  roomId: string;
  unitNumber: string;
  roomTypeName: string;
  operationalStatus: string;
  days: RoomRackDay[];
};

/**
 * A specific RoomInventory unit is only bound to a reservation once the guest
 * checks in (via CheckIn) — before that, a reservation only reserves a count
 * of a RoomType, not a physical unit. So the rack can only show ground-truth
 * unit occupancy from CheckIn/CheckOut records; confirmed reservations that
 * haven't checked in yet are surfaced separately as "unassigned" rather than
 * guessed onto a specific room, to avoid implying a binding assignment that
 * doesn't exist in the data.
 */
export async function getRoomRackData(hotelId: string, startDate: Date, days: number) {
  const rangeStart = new Date(startDate);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + days);

  const [rooms, checkIns, unassignedReservations] = await Promise.all([
    prisma.roomInventory.findMany({
      where: { hotelId, isActive: true },
      include: { roomType: { select: { name: true } } },
      orderBy: [{ roomType: { name: "asc" } }, { unitNumber: "asc" }],
    }),
    prisma.checkIn.findMany({
      where: {
        roomInventory: { hotelId },
        checkedInAt: { lt: rangeEnd },
        OR: [{ checkOut: null }, { checkOut: { checkedOutAt: { gte: rangeStart } } }],
      },
      include: { reservation: true, checkOut: true },
    }),
    prisma.reservation.findMany({
      where: {
        hotelId,
        status: { in: ["PENDING", "CONFIRMED"] },
        checkIn: null,
        checkInDate: { lt: rangeEnd },
        checkOutDate: { gt: rangeStart },
      },
      include: { roomItems: { include: { roomType: { select: { name: true } } } } },
      orderBy: { checkInDate: "asc" },
    }),
  ]);

  const dayKeys = Array.from({ length: days }, (_, i) => {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const checkInsByRoom = new Map<string, typeof checkIns>();
  for (const checkIn of checkIns) {
    const list = checkInsByRoom.get(checkIn.roomInventoryId) ?? [];
    list.push(checkIn);
    checkInsByRoom.set(checkIn.roomInventoryId, list);
  }

  const rows: RoomRackRow[] = rooms.map((room) => {
    const roomCheckIns = checkInsByRoom.get(room.id) ?? [];
    const roomDays: RoomRackDay[] = dayKeys.map((dateKey) => {
      const dayStart = new Date(`${dateKey}T00:00:00.000Z`);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const match = roomCheckIns.find((checkIn) => {
        const outAt = checkIn.checkOut?.checkedOutAt ?? null;
        return checkIn.checkedInAt < dayEnd && (!outAt || outAt > dayStart);
      });
      return {
        date: dateKey,
        occupied: Boolean(match),
        guestName: match
          ? `${match.reservation.guestFirstName} ${match.reservation.guestLastName}`
          : undefined,
        bookingReference: match?.reservation.bookingReference,
      };
    });
    return {
      roomId: room.id,
      unitNumber: room.unitNumber,
      roomTypeName: room.roomType.name,
      operationalStatus: room.operationalStatus,
      days: roomDays,
    };
  });

  return { dayKeys, rows, unassignedReservations };
}
