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
