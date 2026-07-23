import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getScopedBranchId } from "@/domains/branches/access";

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("vehicles")}</h1>
        <Button render={<Link href="/dashboard/vehicles/new" />}>
          <Plus className="size-4" />
          {t("addVehicle")}
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <p className="text-muted-foreground">{t("noVehiclesYet")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Link key={vehicle.id} href={`/dashboard/vehicles/${vehicle.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="space-y-2 py-5">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {vehicle.brand} {vehicle.model}
                    </p>
                    <Badge variant="secondary">{tStatus(vehicle.status)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{vehicle.branch.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(vehicle.pricePerDay.toString(), vehicle.currency, locale)}{" "}
                    / day
                  </p>
                  {(vehicle.nextMaintenanceDueAt && vehicle.nextMaintenanceDueAt < now) ||
                  (vehicle.insuranceExpiryAt &&
                    vehicle.insuranceExpiryAt.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) ? (
                    <Badge variant="destructive">Needs attention</Badge>
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
