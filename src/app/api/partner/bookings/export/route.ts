import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/export/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reservations = await prisma.reservation.findMany({
    where: { organizationId: membership.organizationId },
    include: {
      hotelLink: { include: { hotel: true } },
      carLink: { include: { vehicle: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Reference",
    "Type",
    "Status",
    "Guest",
    "Email",
    "Item",
    "Total",
    "Currency",
    "Created At",
  ];

  const rows = reservations.map((r) => [
    r.bookingReference,
    r.type,
    r.status,
    `${r.guestFirstName} ${r.guestLastName}`,
    r.guestEmail,
    r.type === "HOTEL"
      ? (r.hotelLink?.hotel.name ?? "")
      : `${r.carLink?.vehicle.brand ?? ""} ${r.carLink?.vehicle.model ?? ""}`,
    r.totalAmount.toString(),
    r.currency,
    r.createdAt.toISOString(),
  ]);

  const csv = toCsv(header, rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings.csv"`,
    },
  });
}
