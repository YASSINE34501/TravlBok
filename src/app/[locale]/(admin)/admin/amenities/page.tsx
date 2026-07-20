import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Badge } from "@/components/ui/badge";
import { AddAmenityForm } from "@/components/admin/add-amenity-form";

export default async function AdminAmenitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");

  const amenities = await prisma.amenity.findMany({ orderBy: { category: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("amenities")}</h1>
      <AddAmenityForm locale={locale} />

      <div className="flex flex-wrap gap-2">
        {amenities.map((amenity) => (
          <Badge key={amenity.id} variant="secondary" className="gap-1.5">
            <span className="text-[10px] uppercase text-muted-foreground">
              {amenity.category}
            </span>
            {pickLocaleText(amenity.name as Record<string, unknown>, locale)}
          </Badge>
        ))}
      </div>
    </div>
  );
}
