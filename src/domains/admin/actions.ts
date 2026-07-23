"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { notifyUser, notifyOrganizationOwners } from "@/domains/notifications/service";

const PLATFORM_STAFF = ROLE_GROUPS.platformStaff;

// ---- Organizations ----

export async function approveOrganizationAction(locale: string, organizationId: string) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      verificationStatus: "APPROVED",
      reviewedByUserId: admin.id,
      reviewedAt: new Date(),
      rejectionReason: null,
      changeRequestNotes: null,
    },
  });
  await logAudit({
    actorUserId: admin.id,
    organizationId,
    action: "admin.organization.approve",
    entityType: "Organization",
    entityId: organizationId,
  });
  await notifyOrganizationOwners(organizationId, {
    type: "organization_approved",
    title: "Organization approved",
    message: "Your organization has been approved by TravlBok.",
    channels: ["IN_APP", "EMAIL"],
  });
  revalidatePath(`/${locale}/admin/organizations`);
}

export async function rejectOrganizationAction(
  locale: string,
  organizationId: string,
  reason: string
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      verificationStatus: "REJECTED",
      reviewedByUserId: admin.id,
      reviewedAt: new Date(),
      rejectionReason: reason,
    },
  });
  await logAudit({
    actorUserId: admin.id,
    organizationId,
    action: "admin.organization.reject",
    entityType: "Organization",
    entityId: organizationId,
    metadata: { reason },
  });
  await notifyOrganizationOwners(organizationId, {
    type: "organization_rejected",
    title: "Organization rejected",
    message: `Your organization application was rejected: ${reason}`,
    channels: ["IN_APP", "EMAIL"],
  });
  revalidatePath(`/${locale}/admin/organizations`);
}

export async function requestOrganizationChangesAction(
  locale: string,
  organizationId: string,
  notes: string
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      verificationStatus: "CHANGES_REQUESTED",
      reviewedByUserId: admin.id,
      reviewedAt: new Date(),
      changeRequestNotes: notes,
    },
  });
  await logAudit({
    actorUserId: admin.id,
    organizationId,
    action: "admin.organization.request_changes",
    entityType: "Organization",
    entityId: organizationId,
    metadata: { notes },
  });
  revalidatePath(`/${locale}/admin/organizations`);
}

export async function suspendOrganizationAction(locale: string, organizationId: string) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.organization.update({
    where: { id: organizationId },
    data: { verificationStatus: "SUSPENDED", reviewedByUserId: admin.id, reviewedAt: new Date() },
  });
  await logAudit({
    actorUserId: admin.id,
    organizationId,
    action: "admin.organization.suspend",
    entityType: "Organization",
    entityId: organizationId,
  });
  revalidatePath(`/${locale}/admin/organizations`);
}

// ---- Hotels ----

export async function approveHotelAction(locale: string, hotelId: string) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  const hotel = await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      status: "APPROVED",
      reviewedByUserId: admin.id,
      reviewedAt: new Date(),
      rejectionReason: null,
      changeRequestNotes: null,
    },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.hotel.approve",
    entityType: "Hotel",
    entityId: hotelId,
  });
  await notifyOrganizationOwners(hotel.organizationId, {
    type: "property_approved",
    title: "Property approved",
    message: `${hotel.name} has been approved and can now be published.`,
    metadata: { hotelId },
    channels: ["IN_APP", "EMAIL"],
  });
  revalidatePath(`/${locale}/admin/hotels`);
}

export async function rejectHotelAction(locale: string, hotelId: string, reason: string) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  const hotel = await prisma.hotel.update({
    where: { id: hotelId },
    data: { status: "REJECTED", reviewedByUserId: admin.id, reviewedAt: new Date(), rejectionReason: reason },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.hotel.reject",
    entityType: "Hotel",
    entityId: hotelId,
    metadata: { reason },
  });
  await notifyOrganizationOwners(hotel.organizationId, {
    type: "property_rejected",
    title: "Property rejected",
    message: `${hotel.name} was rejected: ${reason}`,
    metadata: { hotelId },
    channels: ["IN_APP", "EMAIL"],
  });
  revalidatePath(`/${locale}/admin/hotels`);
}

export async function requestHotelChangesAction(locale: string, hotelId: string, notes: string) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      status: "CHANGES_REQUESTED",
      reviewedByUserId: admin.id,
      reviewedAt: new Date(),
      changeRequestNotes: notes,
    },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.hotel.request_changes",
    entityType: "Hotel",
    entityId: hotelId,
    metadata: { notes },
  });
  revalidatePath(`/${locale}/admin/hotels`);
}

export async function publishHotelAction(locale: string, hotelId: string) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.hotel.update({
    where: { id: hotelId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.hotel.publish",
    entityType: "Hotel",
    entityId: hotelId,
  });
  revalidatePath(`/${locale}/admin/hotels`);
}

export async function unpublishHotelAction(locale: string, hotelId: string) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.hotel.update({ where: { id: hotelId }, data: { status: "UNPUBLISHED" } });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.hotel.unpublish",
    entityType: "Hotel",
    entityId: hotelId,
  });
  revalidatePath(`/${locale}/admin/hotels`);
}

export async function suspendHotelAction(locale: string, hotelId: string) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.hotel.update({ where: { id: hotelId }, data: { status: "SUSPENDED" } });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.hotel.suspend",
    entityType: "Hotel",
    entityId: hotelId,
  });
  revalidatePath(`/${locale}/admin/hotels`);
}

// ---- Vehicles ----

export async function approveVehicleAction(locale: string, vehicleId: string) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  const vehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      approvalStatus: "APPROVED",
      reviewedByUserId: admin.id,
      reviewedAt: new Date(),
      rejectionReason: null,
      changeRequestNotes: null,
    },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.vehicle.approve",
    entityType: "Vehicle",
    entityId: vehicleId,
  });
  await notifyOrganizationOwners(vehicle.organizationId, {
    type: "vehicle_approved",
    title: "Vehicle approved",
    message: `${vehicle.brand} ${vehicle.model} has been approved and can now be published.`,
    metadata: { vehicleId },
    channels: ["IN_APP", "EMAIL"],
  });
  revalidatePath(`/${locale}/admin/vehicles`);
}

export async function rejectVehicleAction(locale: string, vehicleId: string, reason: string) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  const vehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      approvalStatus: "REJECTED",
      reviewedByUserId: admin.id,
      reviewedAt: new Date(),
      rejectionReason: reason,
    },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.vehicle.reject",
    entityType: "Vehicle",
    entityId: vehicleId,
    metadata: { reason },
  });
  await notifyOrganizationOwners(vehicle.organizationId, {
    type: "vehicle_rejected",
    title: "Vehicle rejected",
    message: `${vehicle.brand} ${vehicle.model} was rejected: ${reason}`,
    metadata: { vehicleId },
    channels: ["IN_APP", "EMAIL"],
  });
  revalidatePath(`/${locale}/admin/vehicles`);
}

export async function requestVehicleChangesAction(
  locale: string,
  vehicleId: string,
  notes: string
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      approvalStatus: "CHANGES_REQUESTED",
      reviewedByUserId: admin.id,
      reviewedAt: new Date(),
      changeRequestNotes: notes,
    },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.vehicle.request_changes",
    entityType: "Vehicle",
    entityId: vehicleId,
    metadata: { notes },
  });
  revalidatePath(`/${locale}/admin/vehicles`);
}

export async function publishVehicleAction(locale: string, vehicleId: string) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { approvalStatus: "PUBLISHED", publishedAt: new Date() },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.vehicle.publish",
    entityType: "Vehicle",
    entityId: vehicleId,
  });
  revalidatePath(`/${locale}/admin/vehicles`);
}

export async function unpublishVehicleAction(locale: string, vehicleId: string) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { approvalStatus: "UNPUBLISHED" },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.vehicle.unpublish",
    entityType: "Vehicle",
    entityId: vehicleId,
  });
  revalidatePath(`/${locale}/admin/vehicles`);
}

export async function suspendVehicleAction(locale: string, vehicleId: string) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { approvalStatus: "SUSPENDED" },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.vehicle.suspend",
    entityType: "Vehicle",
    entityId: vehicleId,
  });
  revalidatePath(`/${locale}/admin/vehicles`);
}

// ---- Users ----

export async function suspendUserAction(locale: string, userId: string) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.user.suspend",
    entityType: "User",
    entityId: userId,
  });
  revalidatePath(`/${locale}/admin/users`);
}

export async function activateUserAction(locale: string, userId: string) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.user.activate",
    entityType: "User",
    entityId: userId,
  });
  revalidatePath(`/${locale}/admin/users`);
}

// ---- Exchange rates ----

export async function addExchangeRateAction(
  locale: string,
  targetCurrency: "EUR" | "USD",
  rate: number
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.exchangeRate.create({
    data: {
      baseCurrency: "MAD",
      targetCurrency,
      rate,
      source: "MANUAL",
      createdByUserId: admin.id,
    },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.exchange_rate.add",
    entityType: "ExchangeRate",
    metadata: { targetCurrency, rate },
  });
  revalidatePath(`/${locale}/admin/exchange-rates`);
}

// ---- Amenities ----

export async function createAmenityAction(
  locale: string,
  code: string,
  category: "HOTEL" | "ROOM" | "VEHICLE" | "GENERAL",
  nameEn: string,
  nameFr: string,
  nameAr: string
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.amenity.create({
    data: { code, category, name: { en: nameEn, fr: nameFr, ar: nameAr } },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.amenity.create",
    entityType: "Amenity",
    metadata: { code },
  });
  revalidatePath(`/${locale}/admin/amenities`);
}

// ---- Coupons ----

export async function createCouponAction(
  locale: string,
  input: {
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    scope: "ALL" | "HOTEL" | "CAR";
    validFrom: string;
    validTo: string;
    usageLimit?: number;
  }
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.coupon.create({
    data: {
      code: input.code,
      type: input.type,
      value: input.value,
      scope: input.scope,
      validFrom: new Date(input.validFrom),
      validTo: new Date(input.validTo),
      usageLimit: input.usageLimit,
    },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.coupon.create",
    entityType: "Coupon",
    metadata: { code: input.code },
  });
  revalidatePath(`/${locale}/admin/coupons`);
}

export async function toggleCouponStatusAction(
  locale: string,
  couponId: string,
  status: "ACTIVE" | "INACTIVE"
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.coupon.update({ where: { id: couponId }, data: { status } });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.coupon.status",
    entityType: "Coupon",
    entityId: couponId,
    metadata: { status },
  });
  revalidatePath(`/${locale}/admin/coupons`);
}

// ---- CMS ----

export async function updateCmsPageAction(
  locale: string,
  slug: string,
  content: Record<string, unknown>
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.cmsPage.update({
    where: { slug },
    data: { content: content as never },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.cms.update",
    entityType: "CmsPage",
    metadata: { slug },
  });
  revalidatePath(`/${locale}/admin/cms`);
}

// ---- Reviews ----

export async function moderateReviewAction(
  locale: string,
  reviewId: string,
  status: "APPROVED" | "REJECTED"
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  const review = await prisma.review.update({ where: { id: reviewId }, data: { status } });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.review.moderate",
    entityType: "Review",
    entityId: reviewId,
    metadata: { status },
  });
  await notifyUser({
    userId: review.userId,
    type: status === "APPROVED" ? "review_approved" : "review_rejected",
    title: status === "APPROVED" ? "Your review was published" : "Your review was not published",
    message:
      status === "APPROVED"
        ? "Your review has been approved and is now visible on TravlBok."
        : "Your review did not meet TravlBok's guidelines and was not published.",
    metadata: { reviewId },
    channels: ["IN_APP"],
  });
  revalidatePath(`/${locale}/admin/reviews`);
}

// ---- Countries ----

export async function createCountryAction(
  locale: string,
  code: string,
  nameEn: string,
  nameFr: string,
  nameAr: string
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.country.create({
    data: { code: code.toUpperCase(), name: { en: nameEn, fr: nameFr, ar: nameAr } },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.country.create",
    entityType: "Country",
    metadata: { code },
  });
  revalidatePath(`/${locale}/admin/countries`);
}

// ---- Cities ----

export async function createCityAction(
  locale: string,
  countryId: string,
  nameEn: string,
  nameFr: string,
  nameAr: string
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.city.create({
    data: { countryId, name: { en: nameEn, fr: nameFr, ar: nameAr } },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.city.create",
    entityType: "City",
    metadata: { countryId },
  });
  revalidatePath(`/${locale}/admin/cities`);
}

// ---- Categories ----

export async function createCategoryAction(
  locale: string,
  type: "HOTEL_TYPE" | "VEHICLE_CATEGORY",
  code: string,
  nameEn: string,
  nameFr: string,
  nameAr: string
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.category.create({
    data: { type, code, name: { en: nameEn, fr: nameFr, ar: nameAr } },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.category.create",
    entityType: "Category",
    metadata: { type, code },
  });
  revalidatePath(`/${locale}/admin/categories`);
}

// ---- Cancellation policies ----

export async function createCancellationPolicyAction(
  locale: string,
  input: {
    nameEn: string;
    nameFr: string;
    nameAr: string;
    descriptionEn: string;
    descriptionFr: string;
    descriptionAr: string;
    rules: unknown;
  }
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.cancellationPolicy.create({
    data: {
      name: { en: input.nameEn, fr: input.nameFr, ar: input.nameAr },
      description: { en: input.descriptionEn, fr: input.descriptionFr, ar: input.descriptionAr },
      rules: input.rules as never,
    },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.cancellation_policy.create",
    entityType: "CancellationPolicy",
  });
  revalidatePath(`/${locale}/admin/cancellation-policies`);
}

// ---- Commission rules ----

export async function createCommissionRuleAction(
  locale: string,
  input: {
    organizationId: string | null;
    serviceType: "HOTEL" | "CAR";
    type: "PERCENTAGE" | "FIXED";
    value: number;
  }
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.commissionRule.create({
    data: {
      organizationId: input.organizationId,
      serviceType: input.serviceType,
      type: input.type,
      value: input.value,
    },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.commission_rule.create",
    entityType: "CommissionRule",
    metadata: input,
  });
  revalidatePath(`/${locale}/admin/commission-rules`);
}

export async function deleteCommissionRuleAction(locale: string, commissionRuleId: string) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.commissionRule.delete({ where: { id: commissionRuleId } });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.commission_rule.delete",
    entityType: "CommissionRule",
    entityId: commissionRuleId,
  });
  revalidatePath(`/${locale}/admin/commission-rules`);
}

// ---- Homepage sections ----

export async function upsertHomepageSectionAction(
  locale: string,
  input: {
    key: string;
    titleEn?: string;
    titleFr?: string;
    titleAr?: string;
    config: unknown;
    sortOrder: number;
    isActive: boolean;
  }
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  const title =
    input.titleEn || input.titleFr || input.titleAr
      ? { en: input.titleEn ?? "", fr: input.titleFr ?? "", ar: input.titleAr ?? "" }
      : undefined;
  await prisma.homepageSection.upsert({
    where: { key: input.key },
    update: {
      title: title as never,
      config: input.config as never,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
    create: {
      key: input.key,
      title: title as never,
      config: input.config as never,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.homepage_section.upsert",
    entityType: "HomepageSection",
    metadata: { key: input.key },
  });
  revalidatePath(`/${locale}/admin/homepage-sections`);
}

export async function toggleHomepageSectionAction(
  locale: string,
  homepageSectionId: string,
  isActive: boolean
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.homepageSection.update({
    where: { id: homepageSectionId },
    data: { isActive },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.homepage_section.toggle",
    entityType: "HomepageSection",
    entityId: homepageSectionId,
    metadata: { isActive },
  });
  revalidatePath(`/${locale}/admin/homepage-sections`);
}

// ---- Global settings ----

export async function updateGlobalSettingsAction(
  locale: string,
  value: { defaultLocale: string; defaultCurrency: string; maintenanceMode: boolean }
) {
  const admin = await requireRole(locale, PLATFORM_STAFF);
  await prisma.globalSetting.upsert({
    where: { key: "platform" },
    update: { value },
    create: { key: "platform", value },
  });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.settings.update",
    entityType: "GlobalSetting",
    metadata: value,
  });
  revalidatePath(`/${locale}/admin/settings`);
}
