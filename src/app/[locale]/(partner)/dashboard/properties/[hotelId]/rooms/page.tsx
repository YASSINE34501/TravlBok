import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function RoomsListPage({
  params,
}: {
  params: Promise<{ locale: string; hotelId: string }>;
}) {
  const { locale, hotelId } = await params;
  const t = await getTranslations("Partner");
  const { organization } = await getPartnerContext(locale);

  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, organizationId: organization.id, deletedAt: null },
  });
  if (!hotel) notFound();

  const rooms = await prisma.roomType.findMany({
    where: { hotelId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{hotel.name}</h1>
          <p className="text-sm text-muted-foreground">{t("roomsFor")}</p>
        </div>
        <Button render={<Link href={`/dashboard/properties/${hotelId}/rooms/new`} />}>
          <Plus className="size-4" />
          {t("addRoom")}
        </Button>
      </div>

      {rooms.length === 0 ? (
        <p className="text-muted-foreground">{t("noPropertiesYet")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/dashboard/properties/${hotelId}/rooms/${room.id}`}
            >
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="space-y-2 py-5">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{room.name}</p>
                    <Badge variant={room.isActive ? "secondary" : "outline"}>
                      {room.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatMoney(room.basePrice.toString(), room.currency, locale)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {room.availableQuantity}
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
