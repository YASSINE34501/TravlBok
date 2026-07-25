import { getTranslations } from "next-intl/server";
import { Plus, Car } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getScopedBranchId } from "@/domains/branches/access";
import { VEHICLE_STATUS_TONE } from "@/lib/status-tones";

export default async function VehiclesListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Partner");
  const tStatus = await getTranslations("VehicleStatus");
  const { user, membership, organization } = await getPartnerContext(locale);

  const scopedBranchId = await getScopedBranchId(organization.id, user.id, membership.role);

  const vehicles = await prisma.vehicle.findMany({
    where: {
      organizationId: organization.id,
      deletedAt: null,
      ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
    },
    include: { branch: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("vehicles")}
        actions={
          <Button render={<Link href="/dashboard/vehicles/new" />}>
            <Plus className="size-4" />
            {t("addVehicle")}
          </Button>
        }
      />

      {vehicles.length === 0 ? (
        <EmptyState icon={Car} title={t("noVehiclesYet")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Link key={vehicle.id} href={`/dashboard/vehicles/${vehicle.id}`} className="group block">
              <Card className="rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">
                      {vehicle.brand} {vehicle.model}
                    </p>
                    <StatusBadge tone={VEHICLE_STATUS_TONE[vehicle.status]}>
                      {tStatus(vehicle.status)}
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-muted-foreground">{vehicle.branch.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(vehicle.pricePerDay.toString(), vehicle.currency, locale)} / day
                  </p>
                  {(vehicle.nextMaintenanceDueAt && vehicle.nextMaintenanceDueAt < now) ||
                  (vehicle.insuranceExpiryAt &&
                    vehicle.insuranceExpiryAt.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) ? (
                    <StatusBadge tone="destructive">Needs attention</StatusBadge>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
