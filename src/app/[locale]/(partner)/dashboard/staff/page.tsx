import { getTranslations } from "next-intl/server";
import { Users } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTableShell } from "@/components/ui/data-table";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { InviteStaffForm } from "@/components/partner/invite-staff-form";
import { RemoveStaffButton } from "@/components/partner/remove-staff-button";
import { StaffBranchSelect } from "@/components/partner/staff-branch-select";
import type { OrgMemberStatus, Role } from "@/generated/prisma/client";

const HOTEL_STAFF_ROLES: Role[] = [
  "HOTEL_MANAGER",
  "RECEPTIONIST",
  "HOUSEKEEPING_STAFF",
  "HOTEL_ACCOUNTANT",
];
const CAR_STAFF_ROLES: Role[] = ["CAR_RENTAL_STAFF"];

const MEMBER_STATUS_TONE: Record<OrgMemberStatus, StatusTone> = {
  INVITED: "warning",
  ACTIVE: "success",
  SUSPENDED: "destructive",
};

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
      <PageHeader title={t("staff")} />

      <Card className="rounded-2xl p-5">
        <InviteStaffForm
          locale={locale}
          organizationId={organization.id}
          availableRoles={availableRoles}
          branches={isCarRental ? branchOptions : undefined}
        />
      </Card>

      <DataTableShell>
        {members.length === 0 ? (
          <EmptyState icon={Users} title={t("noBookingsYet")} className="border-0 py-12" />
        ) : (
          <div className="divide-y">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-sm sm:px-5"
              >
                <span className="text-foreground">
                  {member.user.firstName} {member.user.lastName}{" "}
                  <span className="text-muted-foreground">
                    ({member.user.email}) · {tRoles(member.role)}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={MEMBER_STATUS_TONE[member.status]}>
                    {member.status}
                  </StatusBadge>
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
        )}
      </DataTableShell>
    </div>
  );
}
