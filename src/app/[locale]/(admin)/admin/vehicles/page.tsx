import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApprovalActions } from "@/components/admin/approval-actions";
import {
  approveVehicleAction,
  rejectVehicleAction,
  requestVehicleChangesAction,
  suspendVehicleAction,
  publishVehicleAction,
  unpublishVehicleAction,
} from "@/domains/admin/actions";

export default async function AdminVehiclesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tAdmin = await getTranslations("Admin");
  const tStatus = await getTranslations("PropertyStatus");

  const vehicles = await prisma.vehicle.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { organization: true, branch: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{tAdmin("vehicles")}</h1>

      <div className="space-y-3">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium">
                  {vehicle.brand} {vehicle.model}
                </p>
                <p className="text-sm text-muted-foreground">
                  {vehicle.organization.displayName} · {vehicle.branch.name}
                </p>
              </div>
              <Badge variant="secondary">{tStatus(vehicle.approvalStatus)}</Badge>
              <ApprovalActions
                status={vehicle.approvalStatus}
                onApprove={approveVehicleAction.bind(null, locale, vehicle.id)}
                onReject={rejectVehicleAction.bind(null, locale, vehicle.id)}
                onRequestChanges={requestVehicleChangesAction.bind(null, locale, vehicle.id)}
                onSuspend={suspendVehicleAction.bind(null, locale, vehicle.id)}
                onPublish={publishVehicleAction.bind(null, locale, vehicle.id)}
                onUnpublish={unpublishVehicleAction.bind(null, locale, vehicle.id)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
