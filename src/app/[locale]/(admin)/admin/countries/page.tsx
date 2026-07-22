import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Badge } from "@/components/ui/badge";
import { AddCountryForm } from "@/components/admin/add-country-form";

export default async function AdminCountriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");

  const countries = await prisma.country.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("countries")}</h1>
      <AddCountryForm locale={locale} />

      <div className="flex flex-wrap gap-2">
        {countries.map((country) => (
          <Badge key={country.id} variant="secondary" className="gap-1.5">
            <span className="text-[10px] uppercase text-muted-foreground">{country.code}</span>
            {pickLocaleText(country.name as Record<string, unknown>, locale)}
          </Badge>
        ))}
      </div>
    </div>
  );
}
