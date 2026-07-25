import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Plus, BedDouble } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

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
      <PageHeader
        title={hotel.name}
        description={t("roomsFor")}
        actions={
          <Button render={<Link href={`/dashboard/properties/${hotelId}/rooms/new`} />}>
            <Plus className="size-4" />
            {t("addRoom")}
          </Button>
        }
      />

      {rooms.length === 0 ? (
        <EmptyState icon={BedDouble} title={t("noPropertiesYet")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/dashboard/properties/${hotelId}/rooms/${room.id}`}
              className="group block"
            >
              <Card className="rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{room.name}</p>
                    <StatusBadge tone={room.isActive ? "success" : "neutral"}>
                      {room.isActive ? "Active" : "Inactive"}
                    </StatusBadge>
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
