"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrganizationAccess, requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { hasFeature } from "@/domains/subscriptions/limits";
import { encryptChannelCredentials } from "./credentials";
import { getChannelProvider } from "./providers/registry";
import { runPushSync, runPullSync, importExternalReservation } from "./sync";
import type { ChannelCredentials, ExternalReservation } from "./providers/types";
import type { ChannelProviderCode } from "@/generated/prisma/client";

type ActionResult = { success: true } | { success: false; error: string };

const CHANNEL_STAFF_ROLES = [...ROLE_GROUPS.partnerOwners, ...ROLE_GROUPS.hotelStaff];

async function requireChannelManagerAccess(locale: string, organizationId: string) {
  const user = await requireOrganizationAccess(locale, organizationId, CHANNEL_STAFF_ROLES);
  const enabled = await hasFeature(organizationId, "featureChannelManager");
  if (!enabled) {
    throw new Error("Channel Manager is not enabled on this organization's plan");
  }
  return user;
}

export async function connectChannelAction(
  locale: string,
  organizationId: string,
  input: {
    hotelId: string;
    provider: ChannelProviderCode;
    externalHotelId?: string;
    credentials: ChannelCredentials;
  }
): Promise<ActionResult> {
  const user = await requireChannelManagerAccess(locale, organizationId);

  const hotel = await prisma.hotel.findFirst({ where: { id: input.hotelId, organizationId } });
  if (!hotel) return { success: false, error: "notFound" };

  const provider = getChannelProvider(input.provider);
  const testResult = await provider.testConnection(input.credentials);
  if (!testResult.success) {
    return { success: false, error: "connectionFailed" };
  }

  const { credentialsCiphertext, credentialsIv } = encryptChannelCredentials(input.credentials);

  const connection = await prisma.channelConnection.upsert({
    where: { hotelId_provider: { hotelId: input.hotelId, provider: input.provider } },
    update: {
      status: "CONNECTED",
      externalHotelId: input.externalHotelId || null,
      credentialsCiphertext,
      credentialsIv,
      connectedAt: new Date(),
      disconnectedAt: null,
      lastErrorMessage: null,
    },
    create: {
      organizationId,
      hotelId: input.hotelId,
      provider: input.provider,
      status: "CONNECTED",
      externalHotelId: input.externalHotelId || null,
      credentialsCiphertext,
      credentialsIv,
      connectedAt: new Date(),
      createdByUserId: user.id,
    },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "channel_manager.connect",
    entityType: "ChannelConnection",
    entityId: connection.id,
    metadata: { provider: input.provider },
  });

  revalidatePath(`/${locale}/dashboard/channels`);
  return { success: true };
}

export async function disconnectChannelAction(
  locale: string,
  organizationId: string,
  channelConnectionId: string
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, CHANNEL_STAFF_ROLES);

  await prisma.channelConnection.update({
    where: { id: channelConnectionId, organizationId },
    data: { status: "DISCONNECTED", disconnectedAt: new Date(), autoSyncEnabled: false },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "channel_manager.disconnect",
    entityType: "ChannelConnection",
    entityId: channelConnectionId,
  });

  revalidatePath(`/${locale}/dashboard/channels`);
  return { success: true };
}

export async function updateAutoSyncAction(
  locale: string,
  organizationId: string,
  channelConnectionId: string,
  autoSyncEnabled: boolean
): Promise<ActionResult> {
  await requireChannelManagerAccess(locale, organizationId);

  await prisma.channelConnection.update({
    where: { id: channelConnectionId, organizationId },
    data: { autoSyncEnabled },
  });

  revalidatePath(`/${locale}/dashboard/channels`);
  return { success: true };
}

export async function createRoomMappingAction(
  locale: string,
  organizationId: string,
  input: {
    channelConnectionId: string;
    roomTypeId: string;
    externalRoomId: string;
    externalRatePlanId?: string;
  }
): Promise<ActionResult> {
  const user = await requireChannelManagerAccess(locale, organizationId);

  const roomType = await prisma.roomType.findFirst({
    where: { id: input.roomTypeId, hotel: { organizationId } },
  });
  if (!roomType) return { success: false, error: "notFound" };

  await prisma.channelRoomMapping.upsert({
    where: {
      channelConnectionId_roomTypeId: {
        channelConnectionId: input.channelConnectionId,
        roomTypeId: input.roomTypeId,
      },
    },
    update: {
      externalRoomId: input.externalRoomId,
      externalRatePlanId: input.externalRatePlanId || null,
      isActive: true,
    },
    create: {
      channelConnectionId: input.channelConnectionId,
      roomTypeId: input.roomTypeId,
      externalRoomId: input.externalRoomId,
      externalRatePlanId: input.externalRatePlanId || null,
    },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "channel_manager.room_mapping.create",
    entityType: "ChannelRoomMapping",
    metadata: { roomTypeId: input.roomTypeId },
  });

  revalidatePath(`/${locale}/dashboard/channels`);
  return { success: true };
}

export async function deleteRoomMappingAction(
  locale: string,
  organizationId: string,
  mappingId: string
): Promise<ActionResult> {
  await requireChannelManagerAccess(locale, organizationId);

  await prisma.channelRoomMapping.update({
    where: { id: mappingId },
    data: { isActive: false },
  });

  revalidatePath(`/${locale}/dashboard/channels`);
  return { success: true };
}

export async function triggerPushSyncAction(
  locale: string,
  organizationId: string,
  channelConnectionId: string,
  type: "AVAILABILITY" | "RATES" | "RESTRICTIONS" | "FULL"
): Promise<ActionResult> {
  const user = await requireChannelManagerAccess(locale, organizationId);
  await runPushSync(channelConnectionId, type, user.id);
  revalidatePath(`/${locale}/dashboard/channels`);
  return { success: true };
}

export async function triggerPullSyncAction(
  locale: string,
  organizationId: string,
  channelConnectionId: string
): Promise<ActionResult> {
  const user = await requireChannelManagerAccess(locale, organizationId);
  await runPullSync(channelConnectionId, user.id);
  revalidatePath(`/${locale}/dashboard/channels`);
  return { success: true };
}

/**
 * No real channel calls our webhook (none of the 6 named providers offer a
 * self-serve integration), so this is the sandbox stand-in for "a booking
 * arrived on the channel side" — lets a partner/admin exercise the full
 * import → conflict-detection → payment/invoice pipeline without needing a
 * real OTA connection. See providers/mock-provider.ts's pullReservations.
 */
export async function simulateIncomingReservationAction(
  locale: string,
  organizationId: string,
  input: {
    channelConnectionId: string;
    externalRoomId: string;
    checkInDate: string;
    checkOutDate: string;
    guestFirstName: string;
    guestLastName: string;
    guestEmail: string;
    totalAmount: number;
  }
): Promise<ActionResult> {
  await requireChannelManagerAccess(locale, organizationId);

  const connection = await prisma.channelConnection.findFirst({
    where: { id: input.channelConnectionId, organizationId },
  });
  if (!connection) return { success: false, error: "notFound" };

  const external: ExternalReservation = {
    externalReservationId: `SIM-${Date.now()}`,
    externalRoomId: input.externalRoomId,
    checkInDate: input.checkInDate,
    checkOutDate: input.checkOutDate,
    guestFirstName: input.guestFirstName,
    guestLastName: input.guestLastName,
    guestEmail: input.guestEmail,
    totalAmount: input.totalAmount,
    currency: "MAD",
    status: "CONFIRMED",
    raw: { simulated: true },
  };

  const outcome = await importExternalReservation(input.channelConnectionId, external);
  if (outcome.status === "SKIPPED") {
    return { success: false, error: "noRoomMapping" };
  }

  revalidatePath(`/${locale}/dashboard/channels`);
  return { success: true };
}

export async function resolveConflictAction(
  locale: string,
  organizationId: string,
  channelReservationImportId: string
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, CHANNEL_STAFF_ROLES);

  await prisma.channelReservationImport.update({
    where: { id: channelReservationImportId },
    data: { hasConflict: false },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "channel_manager.conflict.resolve",
    entityType: "ChannelReservationImport",
    entityId: channelReservationImportId,
  });

  revalidatePath(`/${locale}/dashboard/channels`);
  return { success: true };
}

// ---- Super Admin oversight ----

export async function adminForceDisconnectChannelAction(
  locale: string,
  channelConnectionId: string
): Promise<ActionResult> {
  const admin = await requireRole(locale, ROLE_GROUPS.platformStaff);

  await prisma.channelConnection.update({
    where: { id: channelConnectionId },
    data: { status: "DISCONNECTED", disconnectedAt: new Date(), autoSyncEnabled: false },
  });

  await logAudit({
    actorUserId: admin.id,
    action: "admin.channel_manager.force_disconnect",
    entityType: "ChannelConnection",
    entityId: channelConnectionId,
  });

  revalidatePath(`/${locale}/admin/channels`);
  return { success: true };
}
