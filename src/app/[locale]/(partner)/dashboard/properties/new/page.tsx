import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { HotelForm } from "@/components/partner/hotel-form";

export default async function NewPropertyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Partner");
  const { organization } = await getPartnerContext(locale);

  const [categories, countries, cities, amenities] = await Promise.all([
    prisma.category.findMany({ where: { type: "HOTEL_TYPE" } }),
    prisma.country.findMany(),
    prisma.city.findMany(),
    prisma.amenity.findMany({ where: { category: "HOTEL" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("addProperty")}</h1>
      <HotelForm
        locale={locale}
        organizationId={organization.id}
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
          name: "",
          descriptionEn: "",
          descriptionFr: "",
          descriptionAr: "",
          categoryId: "",
          starRating: undefined,
          countryId: "",
          cityId: "",
          address: "",
          phone: "",
          email: "",
          website: "",
          checkInTime: "15:00",
          checkOutTime: "11:00",
          parking: false,
          breakfast: false,
          restaurant: false,
          swimmingPool: false,
          spa: false,
          gym: false,
          wifi: false,
          airportShuttle: false,
          acceptsPayAtProperty: true,
          acceptsOnlinePayment: true,
          amenityIds: [],
        }}
      />
    </div>
  );
}
