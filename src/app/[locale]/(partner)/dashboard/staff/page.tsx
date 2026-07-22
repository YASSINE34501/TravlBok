import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { InviteStaffForm } from "@/components/partner/invite-staff-form";
import { RemoveStaffButton } from "@/components/partner/remove-staff-button";
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

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: organization.id },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });

  const availableRoles =
    organization.type === "HOTEL" ? HOTEL_STAFF_ROLES : CAR_STAFF_ROLES;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("staff")}</h1>
      <InviteStaffForm
        locale={locale}
        organizationId={organization.id}
        availableRoles={availableRoles}
      />

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <span>
              {member.user.firstName} {member.user.lastName} ({member.user.email}) ·{" "}
              {tRoles(member.role)}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{member.status}</Badge>
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
