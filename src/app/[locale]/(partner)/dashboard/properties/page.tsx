import { getTranslations } from "next-intl/server";
import { Plus, Building2 } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PROPERTY_STATUS_TONE } from "@/lib/status-tones";

export default async function PropertiesListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Partner");
  const tStatus = await getTranslations("PropertyStatus");
  const { organization } = await getPartnerContext(locale);

  const hotels = await prisma.hotel.findMany({
    where: { organizationId: organization.id, deletedAt: null },
    include: { city: true, roomTypes: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("properties")}
        actions={
          <>
            {hotels.length > 1 && (
              <Button variant="outline" render={<Link href="/dashboard/properties/comparison" />}>
                Compare properties
              </Button>
            )}
            <Button render={<Link href="/dashboard/properties/new" />}>
              <Plus className="size-4" />
              {t("addProperty")}
            </Button>
          </>
        }
      />

      {hotels.length === 0 ? (
        <EmptyState icon={Building2} title={t("noPropertiesYet")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => (
            <Link key={hotel.id} href={`/dashboard/properties/${hotel.id}`} className="group block">
              <Card className="rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{hotel.name}</p>
                    <StatusBadge tone={PROPERTY_STATUS_TONE[hotel.status]}>
                      {tStatus(hotel.status)}
                    </StatusBadge>
                  </div>
                  {hotel.city && (
                    <p className="text-sm text-muted-foreground">
                      {pickLocaleText(hotel.city.name as Record<string, unknown>, locale)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {hotel.roomTypes.length} room type(s)
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
