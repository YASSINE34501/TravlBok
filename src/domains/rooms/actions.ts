"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrganizationAccess, ROLE_GROUPS } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { checkOrganizationLimit } from "@/domains/subscriptions/limits";
import {
  roomSchema,
  seasonalPriceSchema,
  blackoutDateSchema,
  type RoomInput,
  type SeasonalPriceInput,
  type BlackoutDateInput,
} from "@/lib/validation/room";

type ActionResult =
  | { success: true; roomId: string }
  | { success: false; error: string };

const ROOM_EDIT_ROLES = [...ROLE_GROUPS.partnerOwners, ...ROLE_GROUPS.hotelStaff];

async function assertHotelOwnership(organizationId: string, hotelId: string) {
  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, organizationId, deletedAt: null },
  });
  if (!hotel) throw new Error("Hotel not found for organization");
  return hotel;
}

function buildRoomData(input: RoomInput) {
  return {
    name: input.name,
    roomTypeLabel: input.roomTypeLabel,
    description: {
      en: input.descriptionEn || "",
      fr: input.descriptionFr || "",
      ar: input.descriptionAr || "",
    },
    maxGuests: input.maxGuests,
    maxAdults: input.maxAdults,
    maxChildren: input.maxChildren,
    bedTypes: input.bedTypes,
    numberOfBeds: input.numberOfBeds,
    bathrooms: input.bathrooms,
    roomSizeSqm: input.roomSizeSqm ?? null,
    smokingAllowed: input.smokingAllowed,
    accessible: input.accessible,
    breakfastIncluded: input.breakfastIncluded,
    refundable: input.refundable,
    basePrice: input.basePrice,
    weekendPrice: input.weekendPrice ?? null,
    taxRatePercent: input.taxRatePercent,
    cleaningFee: input.cleaningFee,
    currency: input.currency,
    availableQuantity: input.availableQuantity,
    minStay: input.minStay,
    maxStay: input.maxStay ?? null,
    instantBooking: input.instantBooking,
  };
}

export async function createRoomAction(
  locale: string,
  organizationId: string,
  hotelId: string,
  input: RoomInput
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, ROOM_EDIT_ROLES);
  await assertHotelOwnership(organizationId, hotelId);

  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "invalidInput" };
  }

  const limitCheck = await checkOrganizationLimit(organizationId, "ROOMS_PER_PROPERTY", {
    hotelId,
  });
  if (!limitCheck.allowed) {
    return { success: false, error: "planLimitReached" };
  }

  const room = await prisma.roomType.create({
    data: {
      hotelId,
      ...buildRoomData(parsed.data),
      amenities: { connect: parsed.data.amenityIds.map((id) => ({ id })) },
    },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "room.create",
    entityType: "RoomType",
    entityId: room.id,
  });

  revalidatePath(`/${locale}/dashboard/properties/${hotelId}/rooms`);
  return { success: true, roomId: room.id };
}

export async function updateRoomAction(
  locale: string,
  organizationId: string,
  hotelId: string,
  roomId: string,
  input: RoomInput
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, ROOM_EDIT_ROLES);
  await assertHotelOwnership(organizationId, hotelId);

  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "invalidInput" };
  }

  const room = await prisma.roomType.findFirst({ where: { id: roomId, hotelId } });
  if (!room) {
    return { success: false, error: "notFound" };
  }

  await prisma.roomType.update({
    where: { id: roomId },
    data: {
      ...buildRoomData(parsed.data),
      amenities: { set: parsed.data.amenityIds.map((id) => ({ id })) },
    },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "room.update",
    entityType: "RoomType",
    entityId: roomId,
  });

  revalidatePath(`/${locale}/dashboard/properties/${hotelId}/rooms/${roomId}`);
  return { success: true, roomId };
}

export async function deleteRoomAction(
  locale: string,
  organizationId: string,
  hotelId: string,
  roomId: string
): Promise<void> {
  const user = await requireOrganizationAccess(locale, organizationId, ROOM_EDIT_ROLES);
  await assertHotelOwnership(organizationId, hotelId);

  await prisma.roomType.update({
    where: { id: roomId },
    data: { deletedAt: new Date(), isActive: false },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "room.delete",
    entityType: "RoomType",
    entityId: roomId,
  });

  revalidatePath(`/${locale}/dashboard/properties/${hotelId}/rooms`);
}

export async function addRoomMediaAction(
  locale: string,
  organizationId: string,
  hotelId: string,
  roomId: string,
  url: string
): Promise<void> {
  await requireOrganizationAccess(locale, organizationId, ROOM_EDIT_ROLES);
  const count = await prisma.roomMedia.count({ where: { roomTypeId: roomId } });
  await prisma.roomMedia.create({
    data: { roomTypeId: roomId, url, sortOrder: count, isMain: count === 0 },
  });
  revalidatePath(`/${locale}/dashboard/properties/${hotelId}/rooms/${roomId}`);
}

export async function removeRoomMediaAction(
  locale: string,
  organizationId: string,
  hotelId: string,
  roomId: string,
  mediaId: string
): Promise<void> {
  await requireOrganizationAccess(locale, organizationId, ROOM_EDIT_ROLES);
  await prisma.roomMedia.delete({ where: { id: mediaId } });
  revalidatePath(`/${locale}/dashboard/properties/${hotelId}/rooms/${roomId}`);
}

export async function addSeasonalPriceAction(
  locale: string,
  organizationId: string,
  hotelId: string,
  roomId: string,
  input: SeasonalPriceInput
): Promise<ActionResult> {
  await requireOrganizationAccess(locale, organizationId, ROOM_EDIT_ROLES);
  const parsed = seasonalPriceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalidInput" };

  await prisma.roomSeasonalPrice.create({
    data: {
      roomTypeId: roomId,
      name: parsed.data.name || null,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      price: parsed.data.price,
      weekendPrice: parsed.data.weekendPrice ?? null,
    },
  });

  revalidatePath(`/${locale}/dashboard/properties/${hotelId}/rooms/${roomId}`);
  return { success: true, roomId };
}

export async function removeSeasonalPriceAction(
  locale: string,
  organizationId: string,
  hotelId: string,
  roomId: string,
  seasonalPriceId: string
): Promise<void> {
  await requireOrganizationAccess(locale, organizationId, ROOM_EDIT_ROLES);
  await prisma.roomSeasonalPrice.delete({ where: { id: seasonalPriceId } });
  revalidatePath(`/${locale}/dashboard/properties/${hotelId}/rooms/${roomId}`);
}

export async function addBlackoutDateAction(
  locale: string,
  organizationId: string,
  hotelId: string,
  roomId: string,
  input: BlackoutDateInput
): Promise<ActionResult> {
  await requireOrganizationAccess(locale, organizationId, ROOM_EDIT_ROLES);
  const parsed = blackoutDateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalidInput" };

  await prisma.roomAvailabilityOverride.upsert({
    where: {
      roomTypeId_date: { roomTypeId: roomId, date: new Date(parsed.data.date) },
    },
    update: { closedForBooking: true, reason: parsed.data.reason || null },
    create: {
      roomTypeId: roomId,
      date: new Date(parsed.data.date),
      closedForBooking: true,
      reason: parsed.data.reason || null,
    },
  });

  revalidatePath(`/${locale}/dashboard/properties/${hotelId}/rooms/${roomId}`);
  return { success: true, roomId };
}

export async function removeBlackoutDateAction(
  locale: string,
  organizationId: string,
  hotelId: string,
  roomId: string,
  overrideId: string
): Promise<void> {
  await requireOrganizationAccess(locale, organizationId, ROOM_EDIT_ROLES);
  await prisma.roomAvailabilityOverride.delete({ where: { id: overrideId } });
  revalidatePath(`/${locale}/dashboard/properties/${hotelId}/rooms/${roomId}`);
}
