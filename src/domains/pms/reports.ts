import "server-only";
import { prisma } from "@/lib/db";

export type OccupancyRow = {
  day: string;
  roomsSold: number;
  revenue: number;
  occupancyPercent: number;
  adr: number;
  revpar: number;
};

/**
 * Occupancy/ADR/RevPAR are date-bucketed aggregates joining Reservation ×
 * ReservationRoomItem — a job Postgres does far more efficiently than
 * pulling every row into Node and reducing in JS. Uses $queryRaw
 * (available via Prisma 7's @prisma/adapter-pg, full Postgres access)
 * rather than Prisma's typed aggregate API, which doesn't map cleanly onto
 * a date-series LEFT JOIN.
 */
export async function getOccupancyReport(
  hotelId: string,
  startDate: Date,
  endDate: Date
): Promise<OccupancyRow[]> {
  const totalRooms = await prisma.roomInventory.count({ where: { hotelId, isActive: true } });

  const rows = await prisma.$queryRaw<{ day: Date; rooms_sold: bigint | null; revenue: string | null }[]>`
    WITH date_series AS (
      SELECT generate_series(${startDate}::date, ${endDate}::date, '1 day')::date AS day
    )
    SELECT
      ds.day AS day,
      COALESCE(SUM(ri.quantity), 0) AS rooms_sold,
      COALESCE(SUM(ri.subtotal / NULLIF(ri.nights, 0)), 0) AS revenue
    FROM date_series ds
    LEFT JOIN "Reservation" r
      ON r."hotelId" = ${hotelId}
      AND r.status IN ('CONFIRMED', 'COMPLETED')
      AND r."checkInDate" <= ds.day
      AND r."checkOutDate" > ds.day
    LEFT JOIN "ReservationRoomItem" ri ON ri."reservationId" = r.id
    GROUP BY ds.day
    ORDER BY ds.day;
  `;

  return rows.map((row) => {
    const roomsSold = Number(row.rooms_sold ?? 0);
    const revenue = Number(row.revenue ?? 0);
    return {
      day: row.day.toISOString().slice(0, 10),
      roomsSold,
      revenue,
      occupancyPercent: totalRooms > 0 ? (roomsSold / totalRooms) * 100 : 0,
      adr: roomsSold > 0 ? revenue / roomsSold : 0,
      revpar: totalRooms > 0 ? revenue / totalRooms : 0,
    };
  });
}

export type RevenueByRoomTypeRow = { roomTypeName: string; roomsSold: number; revenue: number };

export async function getRevenueByRoomType(
  hotelId: string,
  startDate: Date,
  endDate: Date
): Promise<RevenueByRoomTypeRow[]> {
  const rows = await prisma.$queryRaw<
    { room_type_name: string; rooms_sold: bigint; revenue: string }[]
  >`
    SELECT
      rt.name AS room_type_name,
      SUM(ri.quantity) AS rooms_sold,
      SUM(ri.subtotal) AS revenue
    FROM "ReservationRoomItem" ri
    JOIN "Reservation" r ON r.id = ri."reservationId"
    JOIN "RoomType" rt ON rt.id = ri."roomTypeId"
    WHERE r."hotelId" = ${hotelId}
      AND r.status IN ('CONFIRMED', 'COMPLETED')
      AND r."checkInDate" >= ${startDate}
      AND r."checkInDate" < ${endDate}
    GROUP BY rt.name
    ORDER BY revenue DESC;
  `;

  return rows.map((row) => ({
    roomTypeName: row.room_type_name,
    roomsSold: Number(row.rooms_sold),
    revenue: Number(row.revenue),
  }));
}

export async function getArrivalsReport(hotelId: string, date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return prisma.reservation.findMany({
    where: { hotelId, checkInDate: { gte: start, lt: end } },
    include: { roomItems: { include: { roomType: true } }, checkIn: true },
  });
}

export async function getDeparturesReport(hotelId: string, date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return prisma.reservation.findMany({
    where: { hotelId, checkOutDate: { gte: start, lt: end } },
    include: { roomItems: { include: { roomType: true } } },
  });
}

export async function getNoShowsReport(hotelId: string) {
  return prisma.reservation.findMany({ where: { hotelId, status: "NO_SHOW" } });
}

export async function getCancellationsReport(hotelId: string) {
  return prisma.reservation.findMany({
    where: { hotelId, status: { in: ["CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED"] } },
    orderBy: { cancelledAt: "desc" },
  });
}

export async function getOutstandingBalancesReport(hotelId: string) {
  return prisma.payment.findMany({
    where: { reservation: { hotelId }, status: { in: ["PENDING", "AUTHORIZED"] } },
    include: { reservation: true },
  });
}

export async function getRoomStatusReport(hotelId: string) {
  return prisma.roomInventory.findMany({
    where: { hotelId },
    include: { roomType: { select: { name: true } } },
    orderBy: { unitNumber: "asc" },
  });
}

export async function getHousekeepingPerformanceReport(hotelId: string) {
  const tasks = await prisma.housekeepingTask.findMany({
    where: { hotelId, status: { in: ["COMPLETED", "INSPECTED"] }, startedAt: { not: null }, completedAt: { not: null } },
    select: { assignedToUserId: true, startedAt: true, completedAt: true },
  });

  const byStaff = new Map<string, { count: number; totalMinutes: number }>();
  for (const task of tasks) {
    if (!task.assignedToUserId || !task.startedAt || !task.completedAt) continue;
    const minutes = (task.completedAt.getTime() - task.startedAt.getTime()) / 60000;
    const entry = byStaff.get(task.assignedToUserId) ?? { count: 0, totalMinutes: 0 };
    entry.count += 1;
    entry.totalMinutes += minutes;
    byStaff.set(task.assignedToUserId, entry);
  }

  return Array.from(byStaff.entries()).map(([userId, stats]) => ({
    userId,
    tasksCompleted: stats.count,
    averageMinutes: stats.count > 0 ? stats.totalMinutes / stats.count : 0,
  }));
}
