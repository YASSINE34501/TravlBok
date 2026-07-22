import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HomepageSectionForm } from "@/components/admin/homepage-section-form";

export default async function AdminHomepageSectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");

  const sections = await prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("homepageSections")}</h1>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">Add / update a section</h2>
        <div className="mt-2">
          <HomepageSectionForm locale={locale} />
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((section) => {
          const title = section.title as Record<string, unknown> | null;
          return (
            <Card key={section.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  {section.key}
                  {title && ` — ${pickLocaleText(title, locale)}`}
                </CardTitle>
                <Badge variant={section.isActive ? "default" : "secondary"}>
                  {section.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Sort order: {section.sortOrder}</p>
                <HomepageSectionForm
                  locale={locale}
                  section={{
                    key: section.key,
                    titleEn: title ? pickLocaleText(title, "en") : "",
                    titleFr: title ? pickLocaleText(title, "fr") : "",
                    titleAr: title ? pickLocaleText(title, "ar") : "",
                    config: section.config,
                    sortOrder: section.sortOrder,
                    isActive: section.isActive,
                  }}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
