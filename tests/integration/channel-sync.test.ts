import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";

// sync.ts's failure path calls notifySyncFailure -> notifyOrganizationOwners,
// which imports "@/lib/rbac" -> "@/lib/auth" (NextAuth), which doesn't
// resolve cleanly outside Next's bundler/runtime (same root cause as the
// booking-conflict and rbac-role-groups tests). None of these tests exercise
// that failure path, so the notification service is mocked out entirely.
vi.mock("@/domains/notifications/service", () => ({
  notifyUser: vi.fn(async () => {}),
  notifyOrganizationOwners: vi.fn(async () => {}),
}));

const { importExternalReservation } = await import("@/domains/channel-manager/sync");

describe("channel sync: idempotent import + conflict detection (real importExternalReservation, real DB)", () => {
  let organizationId: string;
  let hotelId: string;
  let roomTypeId: string;
  let userId: string;
  let connectionId: string;
  let mappingId: string;
  const reservationIds: string[] = [];

  beforeAll(async () => {
    const org = await prisma.organization.create({
      data: { type: "HOTEL", legalName: "TEST-CHANNEL-SYNC-ORG", displayName: "TEST-CHANNEL-SYNC-ORG" },
    });
    organizationId = org.id;

    const user = await prisma.user.create({
      data: {
        email: `channel-sync-test-${Date.now()}@example.com`,
        firstName: "Channel",
        lastName: "Test",
        role: "HOTEL_OWNER",
        status: "ACTIVE",
      },
    });
    userId = user.id;

    const hotel = await prisma.hotel.create({
      data: {
        organizationId,
        name: "TEST-CHANNEL-SYNC-HOTEL",
        description: { en: "t" },
        address: "a",
      },
    });
    hotelId = hotel.id;

    const roomType = await prisma.roomType.create({
      data: {
        hotelId,
        name: "TEST-CHANNEL-SYNC-ROOM",
        roomTypeLabel: "STANDARD",
        description: { en: "t" },
        maxGuests: 2,
        maxAdults: 2,
        basePrice: 400,
        availableQuantity: 1,
        currency: "MAD",
      },
    });
    roomTypeId = roomType.id;

    const connection = await prisma.channelConnection.create({
      data: {
        organizationId,
        hotelId,
        provider: "MOCK_SANDBOX",
        status: "CONNECTED",
        createdByUserId: userId,
      },
    });
    connectionId = connection.id;

    const mapping = await prisma.channelRoomMapping.create({
      data: { channelConnectionId: connectionId, roomTypeId, externalRoomId: "EXT-ROOM-1" },
    });
    mappingId = mapping.id;
  });

  afterAll(async () => {
    await prisma.invoice.deleteMany({ where: { reservationId: { in: reservationIds } } });
    await prisma.payment.deleteMany({ where: { reservationId: { in: reservationIds } } });
    await prisma.channelReservationImport.deleteMany({ where: { channelConnectionId: connectionId } });
    await prisma.reservation.deleteMany({ where: { id: { in: reservationIds } } });
    await prisma.channelRoomMapping.delete({ where: { id: mappingId } });
    await prisma.channelConnection.delete({ where: { id: connectionId } });
    await prisma.roomType.delete({ where: { id: roomTypeId } });
    await prisma.hotel.delete({ where: { id: hotelId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.organization.delete({ where: { id: organizationId } });
  });

  const checkInDate = "2027-03-10";
  const checkOutDate = "2027-03-12";

  it("imports a new external reservation with no conflict when the room is empty", async () => {
    const outcome = await importExternalReservation(connectionId, {
      externalReservationId: "EXT-RES-1",
      externalRoomId: "EXT-ROOM-1",
      checkInDate,
      checkOutDate,
      guestFirstName: "Alice",
      guestLastName: "Guest",
      guestEmail: "alice@example.com",
      totalAmount: 800,
      currency: "MAD",
      status: "CONFIRMED",
      raw: { test: true },
    });

    expect(outcome.status).toBe("IMPORTED");
    expect(outcome.conflict).toBe(false);

    const importRecord = await prisma.channelReservationImport.findUniqueOrThrow({
      where: {
        channelConnectionId_externalReservationId: {
          channelConnectionId: connectionId,
          externalReservationId: "EXT-RES-1",
        },
      },
    });
    expect(importRecord.hasConflict).toBe(false);
    expect(importRecord.reservationId).toBeTruthy();
    if (importRecord.reservationId) reservationIds.push(importRecord.reservationId);
  });

  it("is idempotent: re-importing the same externalReservationId never creates a second Reservation", async () => {
    const outcome = await importExternalReservation(connectionId, {
      externalReservationId: "EXT-RES-1", // identical to the first test
      externalRoomId: "EXT-ROOM-1",
      checkInDate,
      checkOutDate,
      guestFirstName: "Alice",
      guestLastName: "Guest",
      guestEmail: "alice@example.com",
      totalAmount: 800,
      currency: "MAD",
      status: "CONFIRMED",
      raw: { test: true, retried: true },
    });

    expect(outcome.status).toBe("ALREADY_IMPORTED");

    const count = await prisma.channelReservationImport.count({
      where: { channelConnectionId: connectionId, externalReservationId: "EXT-RES-1" },
    });
    expect(count).toBe(1);
  });

  it("flags hasConflict when a second overlapping booking oversells the only unit", async () => {
    const outcome = await importExternalReservation(connectionId, {
      externalReservationId: "EXT-RES-2", // a different external booking, same dates/room
      externalRoomId: "EXT-ROOM-1",
      checkInDate,
      checkOutDate,
      guestFirstName: "Bob",
      guestLastName: "Guest",
      guestEmail: "bob@example.com",
      totalAmount: 800,
      currency: "MAD",
      status: "CONFIRMED",
      raw: { test: true },
    });

    // Still imported — the channel already confirmed it with the guest —
    // but flagged for manual review, never silently dropped.
    expect(outcome.status).toBe("IMPORTED");
    expect(outcome.conflict).toBe(true);

    const importRecord = await prisma.channelReservationImport.findUniqueOrThrow({
      where: {
        channelConnectionId_externalReservationId: {
          channelConnectionId: connectionId,
          externalReservationId: "EXT-RES-2",
        },
      },
    });
    expect(importRecord.hasConflict).toBe(true);
    expect(importRecord.conflictNotes).toBeTruthy();
    if (importRecord.reservationId) reservationIds.push(importRecord.reservationId);
  });
});
