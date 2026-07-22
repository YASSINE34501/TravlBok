import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Badge } from "@/components/ui/badge";
import { AddCityForm } from "@/components/admin/add-city-form";

export default async function AdminCitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");

  const [cities, countries] = await Promise.all([
    prisma.city.findMany({ include: { country: true }, orderBy: { createdAt: "asc" } }),
    prisma.country.findMany({ orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("cities")}</h1>
      <AddCityForm
        locale={locale}
        countries={countries.map((c) => ({
          id: c.id,
          code: c.code,
          name: pickLocaleText(c.name as Record<string, unknown>, locale),
        }))}
      />

      <div className="flex flex-wrap gap-2">
        {cities.map((city) => (
          <Badge key={city.id} variant="secondary" className="gap-1.5">
            <span className="text-[10px] uppercase text-muted-foreground">
              {city.country.code}
            </span>
            {pickLocaleText(city.name as Record<string, unknown>, locale)}
          </Badge>
        ))}
      </div>
    </div>
  );
}
