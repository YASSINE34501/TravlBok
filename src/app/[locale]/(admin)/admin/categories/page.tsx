import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Badge } from "@/components/ui/badge";
import { AddCategoryForm } from "@/components/admin/add-category-form";

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");

  const categories = await prisma.category.findMany({ orderBy: { type: "asc" } });
  const hotelTypes = categories.filter((c) => c.type === "HOTEL_TYPE");
  const vehicleCategories = categories.filter((c) => c.type === "VEHICLE_CATEGORY");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("categories")}</h1>
      <AddCategoryForm locale={locale} />

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">Hotel types</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {hotelTypes.map((category) => (
            <Badge key={category.id} variant="secondary" className="gap-1.5">
              <span className="text-[10px] uppercase text-muted-foreground">
                {category.code}
              </span>
              {pickLocaleText(category.name as Record<string, unknown>, locale)}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">Vehicle categories</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {vehicleCategories.map((category) => (
            <Badge key={category.id} variant="secondary" className="gap-1.5">
              <span className="text-[10px] uppercase text-muted-foreground">
                {category.code}
              </span>
              {pickLocaleText(category.name as Record<string, unknown>, locale)}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
