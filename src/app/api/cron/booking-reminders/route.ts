import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/domains/notifications/service";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * "Reminders" — meant to be invoked once daily by an external scheduler
 * (same CRON_SECRET-guarded pattern as retry-failed-payments and
 * channel-auto-sync; no in-app job queue, consistent scope boundary).
 * Notifies customers with a hotel check-in or car pickup tomorrow.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrowStart = new Date();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  const [hotelReservations, carReservations] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        type: "HOTEL",
        status: "CONFIRMED",
        checkInDate: { gte: tomorrowStart, lt: tomorrowEnd },
      },
      include: { hotelLink: { include: { hotel: { select: { name: true } } } } },
    }),
    prisma.reservation.findMany({
      where: {
        type: "CAR",
        status: "CONFIRMED",
        pickupAt: { gte: tomorrowStart, lt: tomorrowEnd },
      },
    }),
  ]);

  let sent = 0;

  for (const reservation of hotelReservations) {
    const alreadySent = await prisma.notification.findFirst({
      where: { type: "checkin_reminder", metadata: { path: ["reservationId"], equals: reservation.id } },
    });
    if (alreadySent) continue;
    await notifyUser({
      userId: reservation.customerUserId,
      type: "checkin_reminder",
      title: "Check-in tomorrow",
      message: `Your check-in at ${reservation.hotelLink?.hotel.name ?? "your hotel"} is tomorrow. Booking ${reservation.bookingReference}.`,
      titleKey: "checkinReminderTitle",
      messageKey: "checkinReminderMessage",
      params: { hotelName: reservation.hotelLink?.hotel.name ?? "your hotel", reference: reservation.bookingReference },
      metadata: { reservationId: reservation.id },
      channels: ["IN_APP", "EMAIL"],
    });
    sent += 1;
  }

  for (const reservation of carReservations) {
    const alreadySent = await prisma.notification.findFirst({
      where: { type: "pickup_reminder", metadata: { path: ["reservationId"], equals: reservation.id } },
    });
    if (alreadySent) continue;
    await notifyUser({
      userId: reservation.customerUserId,
      type: "pickup_reminder",
      title: "Vehicle pickup tomorrow",
      message: `Your vehicle pickup is tomorrow. Booking ${reservation.bookingReference}.`,
      titleKey: "pickupReminderTitle",
      messageKey: "pickupReminderMessage",
      params: { reference: reservation.bookingReference },
      metadata: { reservationId: reservation.id },
      channels: ["IN_APP", "EMAIL"],
    });
    sent += 1;
  }

  await logAudit({
    action: "notifications.booking_reminders.run",
    entityType: "Reservation",
    metadata: { sent },
  });

  return NextResponse.json({ sent });
}
