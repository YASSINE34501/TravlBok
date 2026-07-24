import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { getOccupancyReport } from "@/domains/pms/reports";

describe("PMS occupancy/ADR/RevPAR report (real getOccupancyReport, real DB)", () => {
  let hotelOrgId: string;
  let hotelId: string;
  let roomTypeId: string;
  let customerUserId: string;
  let reservationId: string;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 120);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 5); // 5-day report window

  const checkIn = new Date(startDate);
  checkIn.setDate(checkIn.getDate() + 1);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 2); // a real 2-night stay inside the window

  beforeAll(async () => {
    const org = await prisma.organization.create({
      data: { type: "HOTEL", legalName: "TEST-PMS-ORG", displayName: "TEST-PMS-ORG" },
    });
    hotelOrgId = org.id;

    const user = await prisma.user.create({
      data: {
        email: `pms-workflow-test-${Date.now()}@example.com`,
        firstName: "PMS",
        lastName: "Test",
        role: "CUSTOMER",
        status: "ACTIVE",
      },
    });
    customerUserId = user.id;

    const hotel = await prisma.hotel.create({
      data: { organizationId: hotelOrgId, name: "TEST-PMS-HOTEL", description: { en: "t" }, address: "a" },
    });
    hotelId = hotel.id;

    const roomType = await prisma.roomType.create({
      data: {
        hotelId,
        name: "TEST-PMS-ROOM",
        roomTypeLabel: "STANDARD",
        description: { en: "t" },
        maxGuests: 2,
        maxAdults: 2,
        basePrice: 300,
        availableQuantity: 2,
        currency: "MAD",
      },
    });
    roomTypeId = roomType.id;

    // Exactly 2 physical room-inventory units — the report's "total rooms" denominator.
    await prisma.roomInventory.createMany({
      data: [
        { hotelId, roomTypeId, unitNumber: "TEST-101" },
        { hotelId, roomTypeId, unitNumber: "TEST-102" },
      ],
    });

    const reservation = await prisma.reservation.create({
      data: {
        bookingReference: `PMSTEST${Date.now()}`,
        type: "HOTEL",
        status: "CONFIRMED",
        customerUserId,
        organizationId: hotelOrgId,
        currency: "MAD",
        basePriceAmount: 600,
        totalAmount: 600,
        guestFirstName: "PMS",
        guestLastName: "Guest",
        guestEmail: "pms-guest@example.com",
        hotelId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        hotelLink: { create: { hotelId } },
        roomItems: { create: { roomTypeId, quantity: 1, nights: 2, unitPrice: 300, subtotal: 600 } },
      },
    });
    reservationId = reservation.id;
  });

  afterAll(async () => {
    await prisma.reservation.delete({ where: { id: reservationId } });
    await prisma.roomInventory.deleteMany({ where: { hotelId } });
    await prisma.roomType.delete({ where: { id: roomTypeId } });
    await prisma.hotel.delete({ where: { id: hotelId } });
    await prisma.user.delete({ where: { id: customerUserId } });
    await prisma.organization.delete({ where: { id: hotelOrgId } });
  });

  it("computes occupancy/ADR/RevPAR per day, zero on empty nights and correct on booked nights", async () => {
    const rows = await getOccupancyReport(hotelId, startDate, endDate);
    // getOccupancyReport's date series is inclusive of both endpoints (a
    // Postgres generate_series(start, end) quirk) — a 5-day-apart range
    // yields 6 rows, not 5.
    expect(rows).toHaveLength(6);

    const dateKey = (d: Date) => d.toISOString().slice(0, 10);
    const bookedNightKeys = new Set<string>();
    const cursor = new Date(checkIn);
    while (cursor < checkOut) {
      bookedNightKeys.add(dateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const row of rows) {
      if (bookedNightKeys.has(row.day)) {
        expect(row.roomsSold).toBe(1);
        expect(row.revenue).toBe(300); // 600 subtotal / 2 nights, per-night proration
        expect(row.occupancyPercent).toBe(50); // 1 room sold / 2 total rooms
        expect(row.adr).toBe(300); // revenue / rooms sold
        expect(row.revpar).toBe(150); // revenue / total rooms
      } else {
        expect(row.roomsSold).toBe(0);
        expect(row.revenue).toBe(0);
        expect(row.occupancyPercent).toBe(0);
        expect(row.adr).toBe(0);
        expect(row.revpar).toBe(0);
      }
    }
  });
});
