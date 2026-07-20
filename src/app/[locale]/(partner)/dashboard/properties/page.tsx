import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("properties")}</h1>
        <Button render={<Link href="/dashboard/properties/new" />}>
          <Plus className="size-4" />
          {t("addProperty")}
        </Button>
      </div>

      {hotels.length === 0 ? (
        <p className="text-muted-foreground">{t("noPropertiesYet")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => (
            <Link key={hotel.id} href={`/dashboard/properties/${hotel.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="space-y-2 py-5">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{hotel.name}</p>
                    <Badge variant="secondary">{tStatus(hotel.status)}</Badge>
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
