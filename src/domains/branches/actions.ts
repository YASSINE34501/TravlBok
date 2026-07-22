"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrganizationAccess, ROLE_GROUPS } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { branchSchema, type BranchInput } from "@/lib/validation/branch";
import { checkOrganizationLimit } from "@/domains/subscriptions/limits";

type ActionResult =
  | { success: true; branchId: string }
  | { success: false; error: string };

const BRANCH_EDIT_ROLES = [...ROLE_GROUPS.partnerOwners, ...ROLE_GROUPS.carRentalStaff];

export async function createBranchAction(
  locale: string,
  organizationId: string,
  input: BranchInput
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, BRANCH_EDIT_ROLES);

  const parsed = branchSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalidInput" };

  const limitCheck = await checkOrganizationLimit(organizationId, "BRANCHES");
  if (!limitCheck.allowed) return { success: false, error: "planLimitReached" };

  const branch = await prisma.carBranch.create({
    data: {
      organizationId,
      name: parsed.data.name,
      countryId: parsed.data.countryId || null,
      cityId: parsed.data.cityId || null,
      address: parsed.data.address,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      isMainBranch: parsed.data.isMainBranch,
    },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "branch.create",
    entityType: "CarBranch",
    entityId: branch.id,
  });

  revalidatePath(`/${locale}/dashboard/branches`);
  return { success: true, branchId: branch.id };
}

export async function updateBranchAction(
  locale: string,
  organizationId: string,
  branchId: string,
  input: BranchInput
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, BRANCH_EDIT_ROLES);

  const parsed = branchSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalidInput" };

  const branch = await prisma.carBranch.findFirst({ where: { id: branchId, organizationId } });
  if (!branch) return { success: false, error: "notFound" };

  await prisma.carBranch.update({
    where: { id: branchId },
    data: {
      name: parsed.data.name,
      countryId: parsed.data.countryId || null,
      cityId: parsed.data.cityId || null,
      address: parsed.data.address,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      isMainBranch: parsed.data.isMainBranch,
    },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "branch.update",
    entityType: "CarBranch",
    entityId: branchId,
  });

  revalidatePath(`/${locale}/dashboard/branches/${branchId}`);
  return { success: true, branchId };
}

export async function deleteBranchAction(
  locale: string,
  organizationId: string,
  branchId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireOrganizationAccess(locale, organizationId, ROLE_GROUPS.partnerOwners);

  const vehicleCount = await prisma.vehicle.count({
    where: { branchId, deletedAt: null },
  });
  if (vehicleCount > 0) {
    return { success: false, error: "branchHasVehicles" };
  }

  await prisma.carBranch.update({
    where: { id: branchId },
    data: { deletedAt: new Date(), isActive: false },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "branch.delete",
    entityType: "CarBranch",
    entityId: branchId,
  });

  revalidatePath(`/${locale}/dashboard/branches`);
  return { success: true };
}
