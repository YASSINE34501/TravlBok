import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

export const ROLE_GROUPS = {
  platformStaff: ["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"] as Role[],
  hotelStaff: [
    "HOTEL_OWNER",
    "HOTEL_MANAGER",
    "RECEPTIONIST",
    "HOUSEKEEPING_STAFF",
    "HOTEL_ACCOUNTANT",
  ] as Role[],
  carRentalStaff: ["CAR_RENTAL_OWNER", "CAR_RENTAL_STAFF"] as Role[],
  partnerOwners: [
    "HOTEL_OWNER",
    "CAR_RENTAL_OWNER",
    "TRAVEL_AGENCY",
    "TOUR_PROVIDER",
  ] as Role[],
} as const;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  locale: string;
  status: string;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: session.user.role as Role,
    locale: session.user.locale,
    status: session.user.status,
  };
}

export async function requireUser(locale: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  return user;
}

export async function requireRole(
  locale: string,
  allowedRoles: Role[]
): Promise<SessionUser> {
  const user = await requireUser(locale);
  if (!allowedRoles.includes(user.role)) {
    redirect(`/${locale}/unauthorized`);
  }
  return user;
}

/**
 * Verifies the current user is an active member of the given organization,
 * enforcing tenant data isolation. Platform staff (Super Admin/Admin) bypass
 * the membership check but the org must still exist.
 */
export async function requireOrganizationAccess(
  locale: string,
  organizationId: string,
  allowedRoles?: Role[]
): Promise<SessionUser> {
  const user = await requireUser(locale);

  if (ROLE_GROUPS.platformStaff.includes(user.role)) {
    return user;
  }

  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });

  if (!membership || membership.status !== "ACTIVE") {
    redirect(`/${locale}/unauthorized`);
  }

  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    redirect(`/${locale}/unauthorized`);
  }

  return user;
}

export function isPlatformStaff(role: Role): boolean {
  return ROLE_GROUPS.platformStaff.includes(role);
}
