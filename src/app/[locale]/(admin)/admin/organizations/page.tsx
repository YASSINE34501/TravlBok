import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApprovalActions } from "@/components/admin/approval-actions";
import {
  approveOrganizationAction,
  rejectOrganizationAction,
  requestOrganizationChangesAction,
  suspendOrganizationAction,
} from "@/domains/admin/actions";

export default async function AdminOrganizationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tAdmin = await getTranslations("Admin");
  const tOrgType = await getTranslations("OrganizationType");
  const tStatus = await getTranslations("PropertyStatus");

  const organizations = await prisma.organization.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { hotels: true, vehicles: true, members: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{tAdmin("organizations")}</h1>

      <div className="space-y-3">
        {organizations.map((org) => (
          <Card key={org.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{org.displayName}</p>
                <p className="text-sm text-muted-foreground">
                  {tOrgType(org.type)} · {org.legalName}
                </p>
              </div>
              <Badge variant="secondary">{tStatus(org.verificationStatus)}</Badge>
              <ApprovalActions
                status={org.verificationStatus}
                onApprove={approveOrganizationAction.bind(null, locale, org.id)}
                onReject={rejectOrganizationAction.bind(null, locale, org.id)}
                onRequestChanges={requestOrganizationChangesAction.bind(null, locale, org.id)}
                onSuspend={suspendOrganizationAction.bind(null, locale, org.id)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
