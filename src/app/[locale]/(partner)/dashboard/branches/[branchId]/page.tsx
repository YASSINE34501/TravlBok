import { notFound } from "next/navigation";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { BranchForm } from "@/components/partner/branch-form";

export default async function EditBranchPage({
  params,
}: {
  params: Promise<{ locale: string; branchId: string }>;
}) {
  const { locale, branchId } = await params;
  const { organization } = await getPartnerContext(locale);

  const [branch, countries, cities] = await Promise.all([
    prisma.carBranch.findFirst({
      where: { id: branchId, organizationId: organization.id, deletedAt: null },
    }),
    prisma.country.findMany(),
    prisma.city.findMany(),
  ]);

  if (!branch) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{branch.name}</h1>
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
