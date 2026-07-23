import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { InviteStaffForm } from "@/components/partner/invite-staff-form";
import { RemoveStaffButton } from "@/components/partner/remove-staff-button";
import { StaffBranchSelect } from "@/components/partner/staff-branch-select";
import type { Role } from "@/generated/prisma/client";

const HOTEL_STAFF_ROLES: Role[] = [
  "HOTEL_MANAGER",
  "RECEPTIONIST",
  "HOUSEKEEPING_STAFF",
  "HOTEL_ACCOUNTANT",
];
const CAR_STAFF_ROLES: Role[] = ["CAR_RENTAL_STAFF"];

export default async function StaffPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Partner");
  const tRoles = await getTranslations("Roles");
  const { organization } = await getPartnerContext(locale);

  const isCarRental = organization.type === "CAR_RENTAL";

  const [members, branches] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId: organization.id },
      include: { user: true },
      orderBy: { joinedAt: "asc" },
    }),
    isCarRental
      ? prisma.carBranch.findMany({ where: { organizationId: organization.id, deletedAt: null } })
      : Promise.resolve([]),
  ]);

  const availableRoles =
    organization.type === "HOTEL" ? HOTEL_STAFF_ROLES : CAR_STAFF_ROLES;
  const branchOptions = branches.map((b) => ({ id: b.id, name: b.name }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("staff")}</h1>
      <InviteStaffForm
        locale={locale}
        organizationId={organization.id}
        availableRoles={availableRoles}
        branches={isCarRental ? branchOptions : undefined}
      />

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <span>
              {member.user.firstName} {member.user.lastName} ({member.user.email}) ·{" "}
              {tRoles(member.role)}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{member.status}</Badge>
              {isCarRental && member.role === "CAR_RENTAL_STAFF" && (
                <StaffBranchSelect
                  locale={locale}
                  organizationId={organization.id}
                  memberId={member.id}
                  currentBranchId={member.branchId}
                  branches={branchOptions}
                />
              )}
              {!availableRoles.includes(member.role) ? null : (
                <RemoveStaffButton
                  locale={locale}
                  organizationId={organization.id}
                  memberId={member.id}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
