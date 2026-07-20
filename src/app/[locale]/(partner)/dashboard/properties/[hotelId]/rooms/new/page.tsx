import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { RoomForm } from "@/components/partner/room-form";

export default async function NewRoomPage({
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

  const amenities = await prisma.amenity.findMany({ where: { category: "ROOM" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("addRoom")}</h1>
      <RoomForm
        locale={locale}
        organizationId={organization.id}
        hotelId={hotelId}
        amenities={amenities.map((a) => ({
          id: a.id,
          name: pickLocaleText(a.name as Record<string, unknown>, locale),
        }))}
        defaultValues={{
          name: "",
          roomTypeLabel: "",
          descriptionEn: "",
          descriptionFr: "",
          descriptionAr: "",
          maxGuests: 2,
          maxAdults: 2,
          maxChildren: 0,
          bedTypes: ["DOUBLE"],
          numberOfBeds: 1,
          bathrooms: 1,
          roomSizeSqm: undefined,
          smokingAllowed: false,
          accessible: false,
          breakfastIncluded: false,
          refundable: true,
          basePrice: 0,
          weekendPrice: undefined,
          taxRatePercent: 0,
          cleaningFee: 0,
          currency: organization.baseCurrency,
          availableQuantity: 1,
          minStay: 1,
          maxStay: undefined,
          instantBooking: true,
          amenityIds: [],
        }}
      />
    </div>
  );
}
