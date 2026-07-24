import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";

// createHotelReservationAction calls requireUser(locale) (needs a real
// request-scoped session we don't have under Vitest) and the notification
// service (a real email-provider side effect we don't want in a test run).
// Both are mocked; everything else in the booking flow — the Serializable
// transaction, the overlap/overbooking check, pricing, payment/invoice
// creation — runs for real against the live database.
let testUserId: string;

vi.mock("@/lib/rbac", () => ({
  requireUser: vi.fn(async () => ({
    id: testUserId,
    email: "booking-conflict-test@example.com",
    name: "Test Customer",
    role: "CUSTOMER",
    locale: "en",
    status: "ACTIVE",
  })),
  requireOrganizationAccess: vi.fn(),
  ROLE_GROUPS: { partnerOwners: [], hotelStaff: [], carRentalStaff: [] },
}));

vi.mock("@/domains/notifications/service", () => ({
  notifyUser: vi.fn(async () => {}),
  notifyOrganizationOwners: vi.fn(async () => {}),
}));

// recordAffiliateConversion reads the affiliate-tracking cookie via
// next/headers' cookies(), which — like requireUser's session lookup —
// requires a real Next request scope this test doesn't have. Affiliate
// conversion tracking is exercised by its own dedicated test below, not
// this one.
vi.mock("@/domains/affiliates/conversion", () => ({
  recordAffiliateConversion: vi.fn(async () => {}),
}));

const { createHotelReservationAction } = await import("@/domains/reservations/actions");

describe("booking conflict prevention (real createHotelReservationAction, real DB)", () => {
  let hotelId: string;
  let roomTypeId: string;
  const reservationIds: string[] = [];

  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 90);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 2);

  beforeAll(async () => {
    const hotelOrg = await prisma.organization.findFirstOrThrow({
      where: { type: "HOTEL", deletedAt: null },
    });
    const testUser = await prisma.user.create({
      data: {
        email: `booking-conflict-test-${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "Customer",
        role: "CUSTOMER",
        status: "ACTIVE",
      },
    });
    testUserId = testUser.id;

    const hotel = await prisma.hotel.create({
      data: {
        organizationId: hotelOrg.id,
        name: "TEST-BOOKING-CONFLICT-HOTEL",
        description: { en: "t", fr: "t", ar: "t" },
        address: "test address",
        status: "PUBLISHED",
      },
    });
    hotelId = hotel.id;

    const roomType = await prisma.roomType.create({
      data: {
        hotelId: hotel.id,
        name: "TEST-BOOKING-CONFLICT-ROOM",
        roomTypeLabel: "STANDARD",
        description: { en: "t", fr: "t", ar: "t" },
        maxGuests: 2,
        maxAdults: 2,
        basePrice: 500,
        availableQuantity: 1, // exactly one unit — the second overlapping booking must be rejected
        currency: "MAD",
        instantBooking: true,
      },
    });
    roomTypeId = roomType.id;
  });

  afterAll(async () => {
    // Payment/Invoice rows created by createBookingPaymentAndInvoice for
    // each successful booking must be cleaned up before the Reservation
    // (their FK is onDelete: SetNull, not Cascade).
    await prisma.invoice.deleteMany({ where: { reservationId: { in: reservationIds } } });
    await prisma.payment.deleteMany({ where: { reservationId: { in: reservationIds } } });
    await prisma.reservation.deleteMany({ where: { id: { in: reservationIds } } });
    await prisma.roomType.delete({ where: { id: roomTypeId } });
    await prisma.hotel.delete({ where: { id: hotelId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  it("confirms the first booking for the only available unit", async () => {
    const result = await createHotelReservationAction("en", {
      roomTypeId,
      checkInDate: checkIn.toISOString().slice(0, 10),
      checkOutDate: checkOut.toISOString().slice(0, 10),
      quantity: 1,
      guestFirstName: "First",
      guestLastName: "Guest",
      guestEmail: "first-guest@example.com",
      paymentProvider: "CASH_AT_PROPERTY",
    });

    expect(result.success).toBe(true);
    if (result.success) reservationIds.push(result.reservationId);

    const reservation = await prisma.reservation.findUniqueOrThrow({
      where: { id: reservationIds[0] },
    });
    expect(reservation.status).toBe("CONFIRMED");
  });

  it("rejects a second overlapping booking once capacity is exhausted", async () => {
    const overlappingCheckIn = new Date(checkIn);
    overlappingCheckIn.setDate(overlappingCheckIn.getDate() + 1); // overlaps the first booking's 2-night stay

    const result = await createHotelReservationAction("en", {
      roomTypeId,
      checkInDate: overlappingCheckIn.toISOString().slice(0, 10),
      checkOutDate: checkOut.toISOString().slice(0, 10),
      quantity: 1,
      guestFirstName: "Second",
      guestLastName: "Guest",
      guestEmail: "second-guest@example.com",
      paymentProvider: "CASH_AT_PROPERTY",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("notEnoughAvailability");
  });

  it("allows a non-overlapping booking (after the first stay's checkout) once capacity frees up", async () => {
    const laterCheckIn = new Date(checkOut); // starts exactly when the first booking ends
    const laterCheckOut = new Date(laterCheckIn);
    laterCheckOut.setDate(laterCheckOut.getDate() + 1);

    const result = await createHotelReservationAction("en", {
      roomTypeId,
      checkInDate: laterCheckIn.toISOString().slice(0, 10),
      checkOutDate: laterCheckOut.toISOString().slice(0, 10),
      quantity: 1,
      guestFirstName: "Third",
      guestLastName: "Guest",
      guestEmail: "third-guest@example.com",
      paymentProvider: "CASH_AT_PROPERTY",
    });

    expect(result.success).toBe(true);
    if (result.success) reservationIds.push(result.reservationId);
  });
});
