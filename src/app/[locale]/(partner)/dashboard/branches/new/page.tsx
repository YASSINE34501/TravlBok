import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { BranchForm } from "@/components/partner/branch-form";

export default async function NewBranchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Partner");
  const { organization } = await getPartnerContext(locale);

  const [countries, cities] = await Promise.all([
    prisma.country.findMany(),
    prisma.city.findMany(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("addBranch")}</h1>
      <BranchForm
        locale={locale}
        organizationId={organization.id}
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
          name: "",
          countryId: "",
          cityId: "",
          address: "",
          phone: "",
          email: "",
          isMainBranch: false,
        }}
      />
    </div>
  );
}
