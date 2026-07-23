"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrganizationAccess, ROLE_GROUPS } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { checkOrganizationLimit } from "@/domains/subscriptions/limits";
import type { Role } from "@/generated/prisma/client";

type ActionResult = { success: true } | { success: false; error: string };

const STAFF_ROLES: Role[] = [
  "HOTEL_MANAGER",
  "RECEPTIONIST",
  "HOUSEKEEPING_STAFF",
  "HOTEL_ACCOUNTANT",
  "CAR_RENTAL_STAFF",
];

export async function inviteStaffMemberAction(
  locale: string,
  organizationId: string,
  input: { email: string; role: Role; branchId?: string }
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, ROLE_GROUPS.partnerOwners);

  if (!STAFF_ROLES.includes(input.role)) {
    return { success: false, error: "invalidInput" };
  }

  if (input.branchId) {
    const branch = await prisma.carBranch.findFirst({
      where: { id: input.branchId, organizationId, deletedAt: null },
    });
    if (!branch) return { success: false, error: "invalidInput" };
  }

  const limitCheck = await checkOrganizationLimit(organizationId, "STAFF");
  if (!limitCheck.allowed) {
    return { success: false, error: "planLimitReached" };
  }

  const invitee = await prisma.user.findUnique({ where: { email: input.email } });
  if (!invitee) {
    return { success: false, error: "userNotFound" };
  }

  const existingMembership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: invitee.id } },
  });
  if (existingMembership) {
    return { success: false, error: "alreadyMember" };
  }

  await prisma.organizationMember.create({
    data: {
      organizationId,
      userId: invitee.id,
      role: input.role,
      status: "INVITED",
      invitedByUserId: user.id,
      branchId: input.branchId || null,
    },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "staff.invite",
    entityType: "OrganizationMember",
    entityId: invitee.id,
    metadata: { role: input.role, branchId: input.branchId },
  });

  revalidatePath(`/${locale}/dashboard/staff`);
  return { success: true };
}

/** "Branch staff permissions" — restrict (or unrestrict, via null) a car-rental staff member to one branch. */
export async function updateStaffBranchAction(
  locale: string,
  organizationId: string,
  memberId: string,
  branchId: string | null
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, ROLE_GROUPS.partnerOwners);

  const membership = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId },
  });
  if (!membership) return { success: false, error: "notFound" };

  if (branchId) {
    const branch = await prisma.carBranch.findFirst({
      where: { id: branchId, organizationId, deletedAt: null },
    });
    if (!branch) return { success: false, error: "invalidInput" };
  }

  await prisma.organizationMember.update({ where: { id: memberId }, data: { branchId } });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "staff.set_branch",
    entityType: "OrganizationMember",
    entityId: memberId,
    metadata: { branchId },
  });

  revalidatePath(`/${locale}/dashboard/staff`);
  return { success: true };
}

export async function removeStaffMemberAction(
  locale: string,
  organizationId: string,
  memberId: string
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, ROLE_GROUPS.partnerOwners);

  const membership = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId },
  });
  if (!membership) return { success: false, error: "notFound" };
  if (ROLE_GROUPS.partnerOwners.includes(membership.role)) {
    return { success: false, error: "cannotRemoveOwner" };
  }

  await prisma.organizationMember.update({
    where: { id: memberId },
    data: { status: "SUSPENDED" },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "staff.remove",
    entityType: "OrganizationMember",
    entityId: memberId,
  });

  revalidatePath(`/${locale}/dashboard/staff`);
  return { success: true };
}
