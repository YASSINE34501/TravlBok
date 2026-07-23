import { notFound } from "next/navigation";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { formatMoney } from "@/lib/currency/format";
import { BranchForm } from "@/components/partner/branch-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getScopedBranchId } from "@/domains/branches/access";
import { getBranchPerformance } from "@/domains/branches/queries";

export default async function EditBranchPage({
  params,
}: {
  params: Promise<{ locale: string; branchId: string }>;
}) {
  const { locale, branchId } = await params;
  const { user, membership, organization } = await getPartnerContext(locale);

  const scopedBranchId = await getScopedBranchId(organization.id, user.id, membership.role);
  if (scopedBranchId && scopedBranchId !== branchId) notFound();

  const [branch, countries, cities, performance] = await Promise.all([
    prisma.carBranch.findFirst({
      where: { id: branchId, organizationId: organization.id, deletedAt: null },
    }),
    prisma.country.findMany(),
    prisma.city.findMany(),
    getBranchPerformance(organization.id),
  ]);

  if (!branch) notFound();
  const stats = performance.find((p) => p.id === branchId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{branch.name}</h1>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Fleet</p>
              <p className="text-lg font-semibold">{stats.vehicleCount} vehicle(s)</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Utilization</p>
              <p className="text-lg font-semibold">
                {stats.utilizationPercent}% ({stats.rentedCount} rented now)
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-lg font-semibold">
                {formatMoney(String(stats.revenue), organization.baseCurrency, locale)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <BranchForm
        locale={locale}
        organizationId={organization.id}
        branchId={branch.id}
        countries={countries.map((c) => ({
          id: c.id,
          name: pickLocaleText(c.name as Record<string, unknown>, locale),
        }))}
        cities={cities.map((c) => ({
          id: c.id,
          countryId: c.countryId,
          name: pickLocaleText(c.name as Record<string, unknown>, locale),
        }))}
        defaultValues={{
          name: branch.name,
          countryId: branch.countryId ?? "",
          cityId: branch.cityId ?? "",
          address: branch.address,
          phone: branch.phone ?? "",
          email: branch.email ?? "",
          isMainBranch: branch.isMainBranch,
        }}
      />
    </div>
  );
}
