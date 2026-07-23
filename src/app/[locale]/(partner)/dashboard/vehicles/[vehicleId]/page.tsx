import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { VehicleForm } from "@/components/partner/vehicle-form";
import { VehicleMediaManager } from "@/components/partner/vehicle-media-manager";
import { SubmitVehicleButton } from "@/components/partner/submit-vehicle-button";
import { VehicleTransferForm } from "@/components/partner/vehicle-transfer-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getScopedBranchId } from "@/domains/branches/access";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ locale: string; vehicleId: string }>;
}) {
  const { locale, vehicleId } = await params;
  const t = await getTranslations("Partner");
  const tStatus = await getTranslations("PropertyStatus");
  const { user, membership, organization } = await getPartnerContext(locale);

  const scopedBranchId = await getScopedBranchId(organization.id, user.id, membership.role);

  const [vehicle, allBranches, categories] = await Promise.all([
    prisma.vehicle.findFirst({
      where: { id: vehicleId, organizationId: organization.id, deletedAt: null },
      include: { media: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.carBranch.findMany({ where: { organizationId: organization.id, deletedAt: null } }),
    prisma.category.findMany({ where: { type: "VEHICLE_CATEGORY" } }),
  ]);

  if (!vehicle) notFound();
  if (scopedBranchId && vehicle.branchId !== scopedBranchId) notFound();

  const branches = scopedBranchId ? allBranches.filter((b) => b.id === scopedBranchId) : allBranches;

  const description = vehicle.description as Record<string, string>;

  const now = new Date();
  const insuranceExpiringSoon =
    vehicle.insuranceExpiryAt != null &&
    vehicle.insuranceExpiryAt.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000;
  const maintenanceOverdue =
    vehicle.nextMaintenanceDueAt != null && vehicle.nextMaintenanceDueAt.getTime() < now.getTime();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {vehicle.brand} {vehicle.model}
        </h1>
        <div className="flex items-center gap-2">
          {insuranceExpiringSoon && <Badge variant="destructive">Insurance expiring soon</Badge>}
          {maintenanceOverdue && <Badge variant="destructive">Maintenance overdue</Badge>}
          <Badge variant="secondary">{tStatus(vehicle.approvalStatus)}</Badge>
        </div>
      </div>

      {!scopedBranchId && (
        <Card>
          <CardHeader>
            <CardTitle>Fleet location</CardTitle>
          </CardHeader>
          <CardContent>
            <VehicleTransferForm
              locale={locale}
              organizationId={organization.id}
              vehicleId={vehicle.id}
              currentBranchId={vehicle.branchId}
              branches={allBranches.map((b) => ({ id: b.id, name: b.name }))}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("photos")}</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleMediaManager
            locale={locale}
            organizationId={organization.id}
            vehicleId={vehicle.id}
            media={vehicle.media.map((m) => ({ id: m.id, url: m.url }))}
          />
        </CardContent>
      </Card>

      <VehicleForm
        locale={locale}
        organizationId={organization.id}
        vehicleId={vehicle.id}
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: pickLocaleText(c.name as Record<string, unknown>, locale),
        }))}
        defaultValues={{
          branchId: vehicle.branchId,
          categoryId: vehicle.categoryId ?? "",
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color ?? "",
          fuel: vehicle.fuel,
          transmission: vehicle.transmission,
          seats: vehicle.seats,
          doors: vehicle.doors,
          engine: vehicle.engine ?? "",
          registrationReference: vehicle.registrationReference ?? "",
          descriptionEn: description?.en ?? "",
          descriptionFr: description?.fr ?? "",
          descriptionAr: description?.ar ?? "",
          pricePerDay: Number(vehicle.pricePerDay),
          currency: vehicle.currency,
          deposit: vehicle.deposit ? Number(vehicle.deposit) : undefined,
          insuranceExpiryAt: vehicle.insuranceExpiryAt
            ? vehicle.insuranceExpiryAt.toISOString().slice(0, 10)
            : "",
          lastMaintenanceAt: vehicle.lastMaintenanceAt
            ? vehicle.lastMaintenanceAt.toISOString().slice(0, 10)
            : "",
          nextMaintenanceDueAt: vehicle.nextMaintenanceDueAt
            ? vehicle.nextMaintenanceDueAt.toISOString().slice(0, 10)
            : "",
          mileagePolicy: vehicle.mileagePolicy,
          mileageLimitKm: vehicle.mileageLimitKm ?? undefined,
          fuelPolicy: vehicle.fuelPolicy,
          driverOptionAvailable: vehicle.driverOptionAvailable,
          gpsAvailable: vehicle.gpsAvailable,
          childSeatAvailable: vehicle.childSeatAvailable,
          airportDeliveryAvailable: vehicle.airportDeliveryAvailable,
          status: vehicle.status,
        }}
      />

      {vehicle.approvalStatus !== "PUBLISHED" &&
        vehicle.approvalStatus !== "PENDING_REVIEW" && (
          <SubmitVehicleButton
            locale={locale}
            organizationId={organization.id}
            vehicleId={vehicle.id}
          />
        )}
    </div>
  );
}
