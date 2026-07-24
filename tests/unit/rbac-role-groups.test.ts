import { describe, it, expect, vi } from "vitest";
import type { Role } from "@/generated/prisma/client";

// rbac.ts imports "@/lib/auth" (NextAuth's own `auth()`), which in turn pulls
// in next-auth internals that don't resolve cleanly outside Next's own
// bundler/runtime (confirmed: importing it directly under Vitest throws a
// module-resolution error from next-auth's `next/server` import). This test
// only exercises rbac.ts's pure exports (ROLE_GROUPS, isPlatformStaff), which
// never call `auth()`, so a lightweight stub is enough to make the module
// importable at all.
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

const { ROLE_GROUPS, isPlatformStaff } = await import("@/lib/rbac");

const ALL_ROLES: Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "HOTEL_OWNER",
  "HOTEL_MANAGER",
  "RECEPTIONIST",
  "HOUSEKEEPING_STAFF",
  "HOTEL_ACCOUNTANT",
  "CAR_RENTAL_OWNER",
  "CAR_RENTAL_STAFF",
  "TRAVEL_AGENCY",
  "TOUR_PROVIDER",
  "AFFILIATE_PARTNER",
  "CUSTOMER",
  "SUPPORT_AGENT",
];

describe("ROLE_GROUPS — least-privilege structure", () => {
  it("platformStaff and partner-facing groups never overlap (a partner role must never be treated as platform staff)", () => {
    const partnerFacingRoles = new Set([
      ...ROLE_GROUPS.hotelStaff,
      ...ROLE_GROUPS.carRentalStaff,
      ...ROLE_GROUPS.partnerOwners,
      ...ROLE_GROUPS.affiliatePartners,
    ]);
    for (const role of ROLE_GROUPS.platformStaff) {
      expect(partnerFacingRoles.has(role)).toBe(false);
    }
  });

  it("partnerOwners is exactly the set of roles that own an organization type", () => {
    expect(new Set(ROLE_GROUPS.partnerOwners)).toEqual(
      new Set(["HOTEL_OWNER", "CAR_RENTAL_OWNER", "TRAVEL_AGENCY", "TOUR_PROVIDER"])
    );
  });

  it("hotelStaff includes the owner role but no car-rental-only role", () => {
    expect(ROLE_GROUPS.hotelStaff).toContain("HOTEL_OWNER");
    expect(ROLE_GROUPS.hotelStaff).not.toContain("CAR_RENTAL_OWNER");
    expect(ROLE_GROUPS.hotelStaff).not.toContain("CAR_RENTAL_STAFF");
  });

  it("CUSTOMER is not a member of any staff/owner/platform group (least privilege default)", () => {
    const anyPrivilegedGroup = new Set([
      ...ROLE_GROUPS.platformStaff,
      ...ROLE_GROUPS.hotelStaff,
      ...ROLE_GROUPS.carRentalStaff,
      ...ROLE_GROUPS.partnerOwners,
      ...ROLE_GROUPS.affiliatePartners,
    ]);
    expect(anyPrivilegedGroup.has("CUSTOMER")).toBe(false);
  });

  it("every Role enum member is covered by ALL_ROLES (keeps this test file honest if the schema grows)", () => {
    expect(new Set(ALL_ROLES).size).toBe(ALL_ROLES.length);
  });
});

describe("isPlatformStaff", () => {
  it("is true only for SUPER_ADMIN/ADMIN/SUPPORT_AGENT", () => {
    for (const role of ALL_ROLES) {
      expect(isPlatformStaff(role)).toBe(ROLE_GROUPS.platformStaff.includes(role));
    }
  });
});
