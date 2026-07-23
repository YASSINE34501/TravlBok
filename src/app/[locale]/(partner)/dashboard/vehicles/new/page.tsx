import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { VehicleForm } from "@/components/partner/vehicle-form";
import { getScopedBranchId } from "@/domains/branches/access";

export default async function NewVehiclePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Partner");
  const { user, membership, organization } = await getPartnerContext(locale);

  const scopedBranchId = await getScopedBranchId(organization.id, user.id, membership.role);

  const [allBranches, categories] = await Promise.all([
    prisma.carBranch.findMany({ where: { organizationId: organization.id, deletedAt: null } }),
    prisma.category.findMany({ where: { type: "VEHICLE_CATEGORY" } }),
  ]);
  const branches = scopedBranchId ? allBranches.filter((b) => b.id === scopedBranchId) : allBranches;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("addVehicle")}</h1>
      <VehicleForm
        locale={locale}
        organizationId={organization.id}
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: pickLocaleText(c.name as Record<string, unknown>, locale),
        }))}
        defaultValues={{
          branchId: branches[0]?.id ?? "",
          categoryId: "",
          brand: "",
          model: "",
          year: new Date().getFullYear(),
          color: "",
          fuel: "PETROL",
          transmission: "MANUAL",
          seats: 5,
          doors: 5,
          engine: "",
          registrationReference: "",
          descriptionEn: "",
          descriptionFr: "",
          descriptionAr: "",
          pricePerDay: 0,
          currency: organization.baseCurrency,
          deposit: undefined,
          insuranceExpiryAt: "",
          lastMaintenanceAt: "",
          nextMaintenanceDueAt: "",
          mileagePolicy: "UNLIMITED",
          mileageLimitKm: undefined,
          fuelPolicy: "FULL_TO_FULL",
          driverOptionAvailable: false,
          gpsAvailable: false,
          childSeatAvailable: false,
          airportDeliveryAvailable: false,
          status: "AVAILABLE",
        }}
      />
    </div>
  );
}
