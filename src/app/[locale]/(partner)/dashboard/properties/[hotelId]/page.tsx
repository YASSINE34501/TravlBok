import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BedDouble } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { HotelForm } from "@/components/partner/hotel-form";
import { HotelMediaManager } from "@/components/partner/hotel-media-manager";
import { SubmitHotelButton } from "@/components/partner/submit-hotel-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ locale: string; hotelId: string }>;
}) {
  const { locale, hotelId } = await params;
  const t = await getTranslations("Partner");
  const tStatus = await getTranslations("PropertyStatus");
  const { organization } = await getPartnerContext(locale);

  const [hotel, categories, countries, cities, amenities] = await Promise.all([
    prisma.hotel.findFirst({
      where: { id: hotelId, organizationId: organization.id, deletedAt: null },
      include: {
        media: { orderBy: { sortOrder: "asc" } },
        roomTypes: true,
        amenities: { select: { id: true } },
      },
    }),
    prisma.category.findMany({ where: { type: "HOTEL_TYPE" } }),
    prisma.country.findMany(),
    prisma.city.findMany(),
    prisma.amenity.findMany({ where: { category: "HOTEL" } }),
  ]);

  if (!hotel) notFound();

  const description = hotel.description as Record<string, string>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{hotel.name}</h1>
          <Badge variant="secondary" className="mt-1">
            {tStatus(hotel.status)}
          </Badge>
        </div>
        <Button
          variant="outline"
          render={<Link href={`/dashboard/properties/${hotel.id}/rooms`} />}
        >
          <BedDouble className="size-4" />
          {t("roomsFor")} ({hotel.roomTypes.length})
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("photos")}</CardTitle>
        </CardHeader>
        <CardContent>
          <HotelMediaManager
            locale={locale}
            organizationId={organization.id}
            hotelId={hotel.id}
            media={hotel.media.map((m) => ({ id: m.id, url: m.url }))}
          />
        </CardContent>
      </Card>

      <HotelForm
        locale={locale}
        organizationId={organization.id}
        hotelId={hotel.id}
        categories={categories.map((c) => ({
          id: c.id,
          name: pickLocaleText(c.name as Record<string, unknown>, locale),
        }))}
        countries={countries.map((c) => ({
          id: c.id,
          name: pickLocaleText(c.name as Record<string, unknown>, locale),
        }))}
        cities={cities.map((c) => ({
          id: c.id,
          countryId: c.countryId,
          name: pickLocaleText(c.name as Record<string, unknown>, locale),
        }))}
        amenities={amenities.map((a) => ({
          id: a.id,
          name: pickLocaleText(a.name as Record<string, unknown>, locale),
        }))}
        defaultValues={{
          name: hotel.name,
          descriptionEn: description?.en ?? "",
          descriptionFr: description?.fr ?? "",
          descriptionAr: description?.ar ?? "",
          categoryId: hotel.categoryId ?? "",
          starRating: hotel.starRating ?? undefined,
          countryId: hotel.countryId ?? "",
          cityId: hotel.cityId ?? "",
          address: hotel.address,
          phone: hotel.phone ?? "",
          email: hotel.email ?? "",
          website: hotel.website ?? "",
          checkInTime: hotel.checkInTime,
          checkOutTime: hotel.checkOutTime,
          parking: hotel.parking,
          breakfast: hotel.breakfast,
          restaurant: hotel.restaurant,
          swimmingPool: hotel.swimmingPool,
          spa: hotel.spa,
          gym: hotel.gym,
          wifi: hotel.wifi,
          airportShuttle: hotel.airportShuttle,
          acceptsPayAtProperty: hotel.acceptsPayAtProperty,
          acceptsOnlinePayment: hotel.acceptsOnlinePayment,
          amenityIds: hotel.amenities.map((a) => a.id),
        }}
      />

      {hotel.status !== "PUBLISHED" && hotel.status !== "PENDING_REVIEW" && (
        <SubmitHotelButton
          locale={locale}
          organizationId={organization.id}
          hotelId={hotel.id}
        />
      )}
    </div>
  );
}
