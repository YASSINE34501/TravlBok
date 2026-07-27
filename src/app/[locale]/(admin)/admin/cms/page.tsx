import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminCmsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");
  const tStatus = await getTranslations("CmsPageStatus");

  const pages = await prisma.cmsPage.findMany({ orderBy: { slug: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("cmsPages")}</h1>
      <div className="space-y-3">
        {pages.map((page) => (
          <Link key={page.id} href={`/admin/cms/${page.slug}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">
                    {pickLocaleText(page.title as Record<string, unknown>, locale)}
                  </p>
                  <p className="text-sm text-muted-foreground">/{page.slug}</p>
                </div>
                <Badge variant="secondary">{tStatus(page.status)}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
