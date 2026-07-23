import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { getChannelProvider } from "./providers/registry";
import { decryptChannelCredentials } from "./credentials";
import { computeDailyAvailability } from "./inventory";
import { createAdHocPaymentAndInvoice } from "@/domains/payments/booking-payment";
import type { ExternalReservation, ChannelOperationResult } from "./providers/types";
import type {
  SyncJobType,
  SyncJobDirection,
  SyncJobStatus,
  SyncLogLevel,
} from "@/generated/prisma/client";

const DEFAULT_SYNC_HORIZON_DAYS = 60;

function generateBookingReference(): string {
  return `TB${randomBytes(4).toString("hex").toUpperCase()}`;
}

async function createSyncJob(
  channelConnectionId: string,
  type: SyncJobType,
  direction: SyncJobDirection,
  triggeredByUserId?: string
) {
  return prisma.syncJob.create({
    data: { channelConnectionId, type, direction, status: "PROCESSING", triggeredByUserId },
  });
}

async function addLog(
  syncJobId: string,
  level: SyncLogLevel,
  message: string,
  metadata?: unknown
) {
  await prisma.syncLogEntry.create({
    data: { syncJobId, level, message, metadata: metadata as never },
  });
}

async function finishSyncJob(
  syncJobId: string,
  status: SyncJobStatus,
  itemsProcessed: number,
  itemsFailed: number,
  errorMessage?: string
) {
  await prisma.syncJob.update({
    where: { id: syncJobId },
    data: { status, itemsProcessed, itemsFailed, errorMessage, completedAt: new Date() },
  });
}

/**
 * PUSH sync: computes current availability/rates/restrictions from our own
 * tables (via computeDailyAvailability, the same ledger the marketplace
 * booking flow reads) for every active room mapping, and sends them to the
 * channel provider. `type` controls which of the three MASTER-PLAN sync
 * categories this run represents (they're computed together but reported
 * as separate SyncJob rows for clear sync history / retry granularity).
 */
export async function runPushSync(
  channelConnectionId: string,
  type: "AVAILABILITY" | "RATES" | "RESTRICTIONS" | "FULL",
  triggeredByUserId?: string,
  horizonDays: number = DEFAULT_SYNC_HORIZON_DAYS
) {
  const connection = await prisma.channelConnection.findUniqueOrThrow({
    where: { id: channelConnectionId },
    include: { roomMappings: { where: { isActive: true } } },
  });

  const syncJob = await createSyncJob(channelConnectionId, type, "PUSH", triggeredByUserId);
  const credentials = decryptChannelCredentials(connection);
  const provider = getChannelProvider(connection.provider);

  let itemsProcessed = 0;
  let itemsFailed = 0;
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + horizonDays);

  try {
    for (const mapping of connection.roomMappings) {
      const daily = await computeDailyAvailability(mapping.roomTypeId, startDate, endDate);

      const results: ChannelOperationResult[] = [];
      if (type === "AVAILABILITY" || type === "FULL") {
        results.push(
          await provider.pushAvailability(
            credentials,
            daily.map((d) => ({
              externalRoomId: mapping.externalRoomId,
              externalRatePlanId: mapping.externalRatePlanId,
              date: d.date,
              availableCount: d.availableCount,
              price: d.price,
              currency: "MAD",
            }))
          )
        );
      }
      if (type === "RATES" || type === "FULL") {
        results.push(
          await provider.pushRates(
            credentials,
            daily.map((d) => ({
              externalRoomId: mapping.externalRoomId,
              externalRatePlanId: mapping.externalRatePlanId,
              date: d.date,
              availableCount: d.availableCount,
              price: d.price,
              currency: "MAD",
            }))
          )
        );
      }
      if (type === "RESTRICTIONS" || type === "FULL") {
        results.push(
          await provider.pushRestrictions(
            credentials,
            daily.map((d) => ({
              externalRoomId: mapping.externalRoomId,
              externalRatePlanId: mapping.externalRatePlanId,
              date: d.date,
              minStay: d.minStay,
              maxStay: d.maxStay ?? undefined,
              closed: d.closed,
            }))
          )
        );
      }

      for (const result of results) {
        itemsProcessed += result.itemsProcessed;
        itemsFailed += result.itemsFailed;
        for (const detail of result.details ?? []) {
          await addLog(syncJob.id, detail.level, detail.message, detail.metadata);
        }
        if (!result.success) {
          await addLog(
            syncJob.id,
            "ERROR",
            result.errorMessage ?? `Push failed for room mapping ${mapping.id}`
          );
        }
      }
    }

    const status: SyncJobStatus = itemsFailed === 0 ? "COMPLETED" : itemsProcessed > 0 ? "PARTIAL" : "FAILED";
    await finishSyncJob(syncJob.id, status, itemsProcessed, itemsFailed);
    await prisma.channelConnection.update({
      where: { id: channelConnectionId },
      data: { lastSyncedAt: new Date(), lastErrorMessage: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    await addLog(syncJob.id, "ERROR", message);
    await finishSyncJob(syncJob.id, "FAILED", itemsProcessed, itemsFailed, message);
    await prisma.channelConnection.update({
      where: { id: channelConnectionId },
      data: { lastErrorMessage: message, status: "ERROR" },
    });
  }

  return prisma.syncJob.findUniqueOrThrow({ where: { id: syncJob.id } });
}

/**
 * Imports one external reservation. Idempotent via the unique
 * (channelConnectionId, externalReservationId) constraint on
 * ChannelReservationImport — retried/duplicate deliveries never create a
 * second Reservation. Runs the same Serializable-transaction overlap check
 * the marketplace booking flow uses; if the channel's copy of availability
 * was stale and this now oversells the room, the booking is still created
 * (the channel already confirmed it with the guest — refusing it would
 * just hide the problem) but flagged `hasConflict` for manual review,
 * satisfying MASTER-PLAN's "Conflict detection" requirement.
 */
export async function importExternalReservation(
  channelConnectionId: string,
  external: ExternalReservation,
  syncJobId?: string
): Promise<{ status: "IMPORTED" | "ALREADY_IMPORTED" | "CANCELLED" | "SKIPPED"; conflict: boolean }> {
  const existing = await prisma.channelReservationImport.findUnique({
    where: {
      channelConnectionId_externalReservationId: {
        channelConnectionId,
        externalReservationId: external.externalReservationId,
      },
    },
  });

  if (existing) {
    if (external.status === "CANCELLED" && existing.reservationId) {
      const reservation = await prisma.reservation.findUnique({
        where: { id: existing.reservationId },
      });
      if (reservation && reservation.status !== "CANCELLED") {
        await prisma.reservation.update({
          where: { id: existing.reservationId },
          data: { status: "CANCELLED", cancelledAt: new Date(), cancelledReason: "Cancelled via channel" },
        });
        if (syncJobId) {
          await addLog(syncJobId, "INFO", `Reservation ${external.externalReservationId} cancelled via channel.`);
        }
        return { status: "CANCELLED", conflict: false };
      }
    }
    if (syncJobId) {
      await addLog(syncJobId, "INFO", `Reservation ${external.externalReservationId} already imported — skipped.`);
    }
    return { status: "ALREADY_IMPORTED", conflict: false };
  }

  if (external.status === "CANCELLED") {
    // Never seen before and already cancelled — nothing to import.
    return { status: "SKIPPED", conflict: false };
  }

  const connection = await prisma.channelConnection.findUniqueOrThrow({
    where: { id: channelConnectionId },
  });
  const mapping = await prisma.channelRoomMapping.findFirst({
    where: { channelConnectionId, externalRoomId: external.externalRoomId, isActive: true },
    include: { roomType: true },
  });

  if (!mapping) {
    if (syncJobId) {
      await addLog(
        syncJobId,
        "ERROR",
        `No active room mapping for external room ${external.externalRoomId} — cannot import ${external.externalReservationId}.`
      );
    }
    return { status: "SKIPPED", conflict: false };
  }

  const checkIn = new Date(external.checkInDate);
  const checkOut = new Date(external.checkOutDate);

  const result = await prisma.$transaction(
    async (tx) => {
      const overlapping = await tx.reservation.findMany({
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
          checkInDate: { lt: checkOut },
          checkOutDate: { gt: checkIn },
          roomItems: { some: { roomTypeId: mapping.roomTypeId } },
        },
        include: { roomItems: { where: { roomTypeId: mapping.roomTypeId } } },
      });
      const bookedQuantity = overlapping.reduce(
        (sum, r) => sum + r.roomItems.reduce((s, i) => s + i.quantity, 0),
        0
      );
      const hasConflict = bookedQuantity + 1 > mapping.roomType.availableQuantity;

      const nights = Math.max(
        1,
        Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      );

      const reservation = await tx.reservation.create({
        data: {
          bookingReference: generateBookingReference(),
          type: "HOTEL",
          status: "CONFIRMED",
          bookingSource: `CHANNEL:${connection.provider}`,
          customerUserId: connection.createdByUserId,
          organizationId: connection.organizationId,
          currency: mapping.roomType.currency,
          basePriceAmount: external.totalAmount,
          totalAmount: external.totalAmount,
          guestFirstName: external.guestFirstName,
          guestLastName: external.guestLastName,
          guestEmail: external.guestEmail,
          guestPhone: external.guestPhone || null,
          hotelId: mapping.roomType.hotelId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          confirmedAt: new Date(),
          hotelLink: { create: { hotelId: mapping.roomType.hotelId } },
          roomItems: {
            create: {
              roomTypeId: mapping.roomTypeId,
              quantity: 1,
              nights,
              unitPrice: external.totalAmount / nights,
              subtotal: external.totalAmount,
            },
          },
        },
      });

      await tx.channelReservationImport.create({
        data: {
          channelConnectionId,
          externalReservationId: external.externalReservationId,
          reservationId: reservation.id,
          rawPayload: external.raw as never,
          hasConflict,
          conflictNotes: hasConflict
            ? `Imported booking oversells room type by ${bookedQuantity + 1 - mapping.roomType.availableQuantity} unit(s) — the channel confirmed this booking before availability was last synced. Review manually.`
            : null,
        },
      });

      return { reservation, hasConflict };
    },
    { isolationLevel: "Serializable" }
  );

  await createAdHocPaymentAndInvoice(
    result.reservation,
    external.totalAmount,
    `Channel booking ${result.reservation.bookingReference} (${connection.provider})`,
    "MANUAL"
  );

  await logAudit({
    organizationId: connection.organizationId,
    action: "channel.reservation.import",
    entityType: "Reservation",
    entityId: result.reservation.id,
    metadata: { provider: connection.provider, hasConflict: result.hasConflict },
  });

  if (syncJobId) {
    await addLog(
      syncJobId,
      result.hasConflict ? "WARN" : "INFO",
      `Imported reservation ${result.reservation.bookingReference} from ${external.externalReservationId}${
        result.hasConflict ? " — CONFLICT: oversold, needs manual review." : "."
      }`
    );
  }

  return { status: "IMPORTED", conflict: result.hasConflict };
}

export async function runPullSync(channelConnectionId: string, triggeredByUserId?: string) {
  const connection = await prisma.channelConnection.findUniqueOrThrow({
    where: { id: channelConnectionId },
  });
  const syncJob = await createSyncJob(
    channelConnectionId,
    "RESERVATION_IMPORT",
    "PULL",
    triggeredByUserId
  );
  const credentials = decryptChannelCredentials(connection);
  const provider = getChannelProvider(connection.provider);

  let itemsProcessed = 0;
  let itemsFailed = 0;
  let anyConflict = false;

  try {
    const since = connection.lastSyncedAt ?? new Date(0);
    const pullResult = await provider.pullReservations(credentials, since);
    for (const detail of pullResult.details ?? []) {
      await addLog(syncJob.id, detail.level, detail.message, detail.metadata);
    }

    for (const external of pullResult.reservations) {
      try {
        const outcome = await importExternalReservation(channelConnectionId, external, syncJob.id);
        if (outcome.status === "IMPORTED") itemsProcessed += 1;
        if (outcome.conflict) anyConflict = true;
      } catch (error) {
        itemsFailed += 1;
        await addLog(
          syncJob.id,
          "ERROR",
          `Failed to import ${external.externalReservationId}: ${error instanceof Error ? error.message : "unknown error"}`
        );
      }
    }

    const status: SyncJobStatus = anyConflict
      ? "CONFLICT"
      : itemsFailed > 0
        ? "PARTIAL"
        : "COMPLETED";
    await finishSyncJob(syncJob.id, status, itemsProcessed, itemsFailed);
    await prisma.channelConnection.update({
      where: { id: channelConnectionId },
      data: { lastSyncedAt: new Date(), lastErrorMessage: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown pull error";
    await addLog(syncJob.id, "ERROR", message);
    await finishSyncJob(syncJob.id, "FAILED", itemsProcessed, itemsFailed, message);
    await prisma.channelConnection.update({
      where: { id: channelConnectionId },
      data: { lastErrorMessage: message, status: "ERROR" },
    });
  }

  return prisma.syncJob.findUniqueOrThrow({ where: { id: syncJob.id } });
}

/** Pushes our-side cancellation out to any connected channel this reservation came from, or that it's mapped to for outbound notice. */
export async function notifyChannelsOfCancellation(reservationId: string): Promise<void> {
  const channelImport = await prisma.channelReservationImport.findUnique({
    where: { reservationId },
    include: { channelConnection: true },
  });
  if (!channelImport || channelImport.channelConnection.status !== "CONNECTED") return;

  const syncJob = await createSyncJob(channelImport.channelConnectionId, "RESERVATION_IMPORT", "PUSH");
  const credentials = decryptChannelCredentials(channelImport.channelConnection);
  const provider = getChannelProvider(channelImport.channelConnection.provider);

  try {
    const result = await provider.pushCancellation(credentials, channelImport.externalReservationId);
    for (const detail of result.details ?? []) {
      await addLog(syncJob.id, detail.level, detail.message, detail.metadata);
    }
    await finishSyncJob(
      syncJob.id,
      result.success ? "COMPLETED" : "FAILED",
      result.itemsProcessed,
      result.itemsFailed,
      result.errorMessage
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await addLog(syncJob.id, "ERROR", message);
    await finishSyncJob(syncJob.id, "FAILED", 0, 1, message);
  }
}
