"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOrganizationAccess, ROLE_GROUPS } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { hotelSchema, type HotelInput } from "@/lib/validation/hotel";
import { checkOrganizationLimit } from "@/domains/subscriptions/limits";

type ActionResult =
  | { success: true; hotelId: string }
  | { success: false; error: string };

const HOTEL_EDIT_ROLES = [...ROLE_GROUPS.partnerOwners, ...ROLE_GROUPS.hotelStaff];

function buildHotelData(input: HotelInput) {
  return {
    name: input.name,
    description: {
      en: input.descriptionEn || "",
      fr: input.descriptionFr || "",
      ar: input.descriptionAr || "",
    },
    categoryId: input.categoryId || null,
    starRating: input.starRating ?? null,
    countryId: input.countryId || null,
    cityId: input.cityId || null,
    address: input.address,
    phone: input.phone || null,
    email: input.email || null,
    website: input.website || null,
    checkInTime: input.checkInTime,
    checkOutTime: input.checkOutTime,
    parking: input.parking,
    breakfast: input.breakfast,
    restaurant: input.restaurant,
    swimmingPool: input.swimmingPool,
    spa: input.spa,
    gym: input.gym,
    wifi: input.wifi,
    airportShuttle: input.airportShuttle,
    acceptsPayAtProperty: input.acceptsPayAtProperty,
    acceptsOnlinePayment: input.acceptsOnlinePayment,
  };
}

export async function createHotelAction(
  locale: string,
  organizationId: string,
  input: HotelInput
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, HOTEL_EDIT_ROLES);

  const parsed = hotelSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "invalidInput" };
  }

  const limitCheck = await checkOrganizationLimit(organizationId, "PROPERTIES");
  if (!limitCheck.allowed) {
    return { success: false, error: "planLimitReached" };
  }

  const hotel = await prisma.hotel.create({
    data: {
      organizationId,
      ...buildHotelData(parsed.data),
      amenities: { connect: parsed.data.amenityIds.map((id) => ({ id })) },
    },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "hotel.create",
    entityType: "Hotel",
    entityId: hotel.id,
  });

  revalidatePath(`/${locale}/dashboard/properties`);
  return { success: true, hotelId: hotel.id };
}

export async function updateHotelAction(
  locale: string,
  organizationId: string,
  hotelId: string,
  input: HotelInput
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, HOTEL_EDIT_ROLES);

  const parsed = hotelSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "invalidInput" };
  }

  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, organizationId },
  });
  if (!hotel) {
    return { success: false, error: "notFound" };
  }

  await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      ...buildHotelData(parsed.data),
      amenities: { set: parsed.data.amenityIds.map((id) => ({ id })) },
    },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "hotel.update",
    entityType: "Hotel",
    entityId: hotelId,
  });

  revalidatePath(`/${locale}/dashboard/properties/${hotelId}`);
  return { success: true, hotelId };
}

export async function submitHotelForApprovalAction(
  locale: string,
  organizationId: string,
  hotelId: string
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, HOTEL_EDIT_ROLES);

  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, organizationId },
    include: { roomTypes: true },
  });
  if (!hotel) {
    return { success: false, error: "notFound" };
  }
  if (hotel.roomTypes.length === 0) {
    return { success: false, error: "roomRequired" };
  }

  await prisma.hotel.update({
    where: { id: hotelId },
    data: { status: "PENDING_REVIEW", submittedAt: new Date() },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "hotel.submit_for_approval",
    entityType: "Hotel",
    entityId: hotelId,
  });

  revalidatePath(`/${locale}/dashboard/properties/${hotelId}`);
  return { success: true, hotelId };
}

export async function setHotelMainImageAction(
  locale: string,
  organizationId: string,
  hotelId: string,
  imageUrl: string
): Promise<void> {
  await requireOrganizationAccess(locale, organizationId, HOTEL_EDIT_ROLES);
  await prisma.hotel.update({
    where: { id: hotelId },
    data: { mainImageUrl: imageUrl },
  });
  revalidatePath(`/${locale}/dashboard/properties/${hotelId}`);
}

export async function addHotelMediaAction(
  locale: string,
  organizationId: string,
  hotelId: string,
  url: string
): Promise<void> {
  await requireOrganizationAccess(locale, organizationId, HOTEL_EDIT_ROLES);
  const count = await prisma.hotelMedia.count({ where: { hotelId } });
  await prisma.hotelMedia.create({
    data: { hotelId, url, sortOrder: count, isMain: count === 0 },
  });
  if (count === 0) {
    await prisma.hotel.update({ where: { id: hotelId }, data: { mainImageUrl: url } });
  }
  revalidatePath(`/${locale}/dashboard/properties/${hotelId}`);
}

export async function removeHotelMediaAction(
  locale: string,
  organizationId: string,
  hotelId: string,
  mediaId: string
): Promise<void> {
  await requireOrganizationAccess(locale, organizationId, HOTEL_EDIT_ROLES);
  await prisma.hotelMedia.delete({ where: { id: mediaId } });
  revalidatePath(`/${locale}/dashboard/properties/${hotelId}`);
}

export async function deleteHotelAction(
  locale: string,
  organizationId: string,
  hotelId: string
): Promise<void> {
  const user = await requireOrganizationAccess(locale, organizationId, ROLE_GROUPS.partnerOwners);
  await prisma.hotel.update({
    where: { id: hotelId },
    data: { deletedAt: new Date(), status: "UNPUBLISHED" },
  });
  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "hotel.delete",
    entityType: "Hotel",
    entityId: hotelId,
  });
  revalidatePath(`/${locale}/dashboard/properties`);
  redirect(`/${locale}/dashboard/properties`);
}
