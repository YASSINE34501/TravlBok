"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrganizationAccess, ROLE_GROUPS } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { vehicleSchema, type VehicleInput } from "@/lib/validation/vehicle";
import { checkOrganizationLimit } from "@/domains/subscriptions/limits";
import { getScopedBranchId } from "@/domains/branches/access";

type ActionResult =
  | { success: true; vehicleId: string }
  | { success: false; error: string };

const VEHICLE_EDIT_ROLES = [...ROLE_GROUPS.partnerOwners, ...ROLE_GROUPS.carRentalStaff];

function buildVehicleData(input: VehicleInput) {
  return {
    branchId: input.branchId,
    categoryId: input.categoryId || null,
    brand: input.brand,
    model: input.model,
    year: input.year,
    color: input.color || null,
    fuel: input.fuel,
    transmission: input.transmission,
    seats: input.seats,
    doors: input.doors,
    engine: input.engine || null,
    registrationReference: input.registrationReference || null,
    description: {
      en: input.descriptionEn || "",
      fr: input.descriptionFr || "",
      ar: input.descriptionAr || "",
    },
    pricePerDay: input.pricePerDay,
    currency: input.currency,
    deposit: input.deposit ?? null,
    insuranceExpiryAt: input.insuranceExpiryAt ? new Date(input.insuranceExpiryAt) : null,
    lastMaintenanceAt: input.lastMaintenanceAt ? new Date(input.lastMaintenanceAt) : null,
    nextMaintenanceDueAt: input.nextMaintenanceDueAt ? new Date(input.nextMaintenanceDueAt) : null,
    mileagePolicy: input.mileagePolicy,
    mileageLimitKm: input.mileageLimitKm ?? null,
    fuelPolicy: input.fuelPolicy,
    driverOptionAvailable: input.driverOptionAvailable,
    gpsAvailable: input.gpsAvailable,
    childSeatAvailable: input.childSeatAvailable,
    airportDeliveryAvailable: input.airportDeliveryAvailable,
    status: input.status,
  };
}

export async function createVehicleAction(
  locale: string,
  organizationId: string,
  input: VehicleInput
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, VEHICLE_EDIT_ROLES);

  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalidInput" };

  const scopedBranchId = await getScopedBranchId(organizationId, user.id, user.role);
  if (scopedBranchId && parsed.data.branchId !== scopedBranchId) {
    return { success: false, error: "branchNotAllowed" };
  }

  const branch = await prisma.carBranch.findFirst({
    where: { id: parsed.data.branchId, organizationId },
  });
  if (!branch) return { success: false, error: "invalidInput" };

  const limitCheck = await checkOrganizationLimit(organizationId, "VEHICLES");
  if (!limitCheck.allowed) return { success: false, error: "planLimitReached" };

  const vehicle = await prisma.vehicle.create({
    data: { organizationId, ...buildVehicleData(parsed.data) },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "vehicle.create",
    entityType: "Vehicle",
    entityId: vehicle.id,
  });

  revalidatePath(`/${locale}/dashboard/vehicles`);
  return { success: true, vehicleId: vehicle.id };
}

export async function updateVehicleAction(
  locale: string,
  organizationId: string,
  vehicleId: string,
  input: VehicleInput
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, VEHICLE_EDIT_ROLES);

  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalidInput" };

  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, organizationId } });
  if (!vehicle) return { success: false, error: "notFound" };

  const scopedBranchId = await getScopedBranchId(organizationId, user.id, user.role);
  if (scopedBranchId && (vehicle.branchId !== scopedBranchId || parsed.data.branchId !== scopedBranchId)) {
    return { success: false, error: "branchNotAllowed" };
  }

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: buildVehicleData(parsed.data),
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "vehicle.update",
    entityType: "Vehicle",
    entityId: vehicleId,
  });

  revalidatePath(`/${locale}/dashboard/vehicles/${vehicleId}`);
  return { success: true, vehicleId };
}

/**
 * Explicit fleet-transfer flow (separate from the general edit form) so a
 * branch change is always intentional and individually audit-logged with
 * both the origin and destination branch — the "fleet location" history.
 */
export async function transferVehicleAction(
  locale: string,
  organizationId: string,
  vehicleId: string,
  newBranchId: string
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, VEHICLE_EDIT_ROLES);

  const scopedBranchId = await getScopedBranchId(organizationId, user.id, user.role);
  if (scopedBranchId) {
    // Branch-scoped staff can't transfer vehicles at all — moving fleet
    // across branches is an owner/manager (or unscoped staff) decision.
    return { success: false, error: "branchNotAllowed" };
  }

  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, organizationId } });
  if (!vehicle) return { success: false, error: "notFound" };

  const newBranch = await prisma.carBranch.findFirst({
    where: { id: newBranchId, organizationId, deletedAt: null },
  });
  if (!newBranch) return { success: false, error: "notFound" };

  if (vehicle.branchId === newBranchId) {
    return { success: true, vehicleId };
  }

  await prisma.vehicle.update({ where: { id: vehicleId }, data: { branchId: newBranchId } });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "vehicle.transfer",
    entityType: "Vehicle",
    entityId: vehicleId,
    metadata: { fromBranchId: vehicle.branchId, toBranchId: newBranchId },
  });

  revalidatePath(`/${locale}/dashboard/vehicles/${vehicleId}`);
  revalidatePath(`/${locale}/dashboard/branches`);
  return { success: true, vehicleId };
}

export async function submitVehicleForApprovalAction(
  locale: string,
  organizationId: string,
  vehicleId: string
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, VEHICLE_EDIT_ROLES);

  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, organizationId } });
  if (!vehicle) return { success: false, error: "notFound" };

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { approvalStatus: "PENDING_REVIEW", submittedAt: new Date() },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "vehicle.submit_for_approval",
    entityType: "Vehicle",
    entityId: vehicleId,
  });

  revalidatePath(`/${locale}/dashboard/vehicles/${vehicleId}`);
  return { success: true, vehicleId };
}

export async function addVehicleMediaAction(
  locale: string,
  organizationId: string,
  vehicleId: string,
  url: string
): Promise<void> {
  await requireOrganizationAccess(locale, organizationId, VEHICLE_EDIT_ROLES);
  const count = await prisma.vehicleMedia.count({ where: { vehicleId } });
  await prisma.vehicleMedia.create({
    data: { vehicleId, url, sortOrder: count, isMain: count === 0 },
  });
  if (count === 0) {
    await prisma.vehicle.update({ where: { id: vehicleId }, data: { mainImageUrl: url } });
  }
  revalidatePath(`/${locale}/dashboard/vehicles/${vehicleId}`);
}

export async function removeVehicleMediaAction(
  locale: string,
  organizationId: string,
  vehicleId: string,
  mediaId: string
): Promise<void> {
  await requireOrganizationAccess(locale, organizationId, VEHICLE_EDIT_ROLES);
  await prisma.vehicleMedia.delete({ where: { id: mediaId } });
  revalidatePath(`/${locale}/dashboard/vehicles/${vehicleId}`);
}

export async function deleteVehicleAction(
  locale: string,
  organizationId: string,
  vehicleId: string
): Promise<void> {
  const user = await requireOrganizationAccess(locale, organizationId, ROLE_GROUPS.partnerOwners);
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { deletedAt: new Date(), status: "INACTIVE", approvalStatus: "UNPUBLISHED" },
  });
  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "vehicle.delete",
    entityType: "Vehicle",
    entityId: vehicleId,
  });
  revalidatePath(`/${locale}/dashboard/vehicles`);
}
