import "server-only";
import { prisma } from "@/lib/db";
import { ROLE_GROUPS } from "@/lib/rbac";
import type { Role } from "@/generated/prisma/client";

/**
 * Car-rental "branch staff permissions": owners/managers and platform staff
 * are always unscoped (see/manage every branch). A CAR_RENTAL_STAFF member
 * is unscoped only if no branch was assigned to them; otherwise they're
 * restricted to the single branch on their `OrganizationMember.branchId`.
 * Returns null for "unscoped", otherwise the one branchId they're limited to.
 */
export async function getScopedBranchId(
  organizationId: string,
  userId: string,
  role: Role
): Promise<string | null> {
  if (ROLE_GROUPS.platformStaff.includes(role) || ROLE_GROUPS.partnerOwners.includes(role)) {
    return null;
  }
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });
  return membership?.branchId ?? null;
}
