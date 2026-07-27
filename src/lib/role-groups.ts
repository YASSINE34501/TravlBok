import type { Role } from "@/generated/prisma/client";

/**
 * Plain data + pure functions only — deliberately has no `"server-only"`
 * import (unlike `@/lib/rbac`) so it's safe to import from Client
 * Components (e.g. the login form's post-sign-in redirect, which needs to
 * classify a role without pulling in `next/navigation`'s `redirect`/Prisma).
 * `rbac.ts` re-exports `ROLE_GROUPS`/`isPlatformStaff` from here rather than
 * duplicating them, so there's one source of truth.
 */
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
  affiliatePartners: ["AFFILIATE_PARTNER"] as Role[],
} as const;

export function isPlatformStaff(role: Role): boolean {
  return ROLE_GROUPS.platformStaff.includes(role);
}

export function isPartnerRole(role: Role): boolean {
  return (
    ROLE_GROUPS.partnerOwners.includes(role) ||
    ROLE_GROUPS.hotelStaff.includes(role) ||
    ROLE_GROUPS.carRentalStaff.includes(role) ||
    ROLE_GROUPS.affiliatePartners.includes(role)
  );
}
