import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { VehicleForm } from "@/components/partner/vehicle-form";
import { VehicleMediaManager } from "@/components/partner/vehicle-media-manager";
import { SubmitVehicleButton } from "@/components/partner/submit-vehicle-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ locale: string; vehicleId: string }>;
}) {
  const { locale, vehicleId } = await params;
  const t = await getTranslations("Partner");
  const tStatus = await getTranslations("PropertyStatus");
  const { organization } = await getPartnerContext(locale);

  const [vehicle, branches, categories] = await Promise.all([
    prisma.vehicle.findFirst({
      where: { id: vehicleId, organizationId: organization.id, deletedAt: null },
      include: { media: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.carBranch.findMany({ where: { organizationId: organization.id, deletedAt: null } }),
    prisma.category.findMany({ where: { type: "VEHICLE_CATEGORY" } }),
  ]);

  if (!vehicle) notFound();

  const description = vehicle.description as Record<string, string>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {vehicle.brand} {vehicle.model}
        </h1>
        <Badge variant="secondary">{tStatus(vehicle.approvalStatus)}</Badge>
      </div>

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
