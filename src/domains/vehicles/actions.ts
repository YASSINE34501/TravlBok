"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrganizationAccess, ROLE_GROUPS } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { vehicleSchema, type VehicleInput } from "@/lib/validation/vehicle";

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

  const branch = await prisma.carBranch.findFirst({
    where: { id: parsed.data.branchId, organizationId },
  });
  if (!branch) return { success: false, error: "invalidInput" };

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
