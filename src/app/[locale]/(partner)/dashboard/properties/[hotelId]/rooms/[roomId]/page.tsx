import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { RoomForm } from "@/components/partner/room-form";
import { RoomMediaManager } from "@/components/partner/room-media-manager";
import { RoomAvailabilityManager } from "@/components/partner/room-availability-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function EditRoomPage({
  params,
}: {
  params: Promise<{ locale: string; hotelId: string; roomId: string }>;
}) {
  const { locale, hotelId, roomId } = await params;
  const t = await getTranslations("Partner");
  const { organization } = await getPartnerContext(locale);

  const [room, amenities] = await Promise.all([
    prisma.roomType.findFirst({
      where: { id: roomId, hotelId, deletedAt: null },
      include: {
        media: { orderBy: { sortOrder: "asc" } },
        amenities: { select: { id: true } },
        seasonalPrices: { orderBy: { startDate: "asc" } },
        availabilityOverrides: {
          where: { closedForBooking: true },
          orderBy: { date: "asc" },
        },
      },
    }),
    prisma.amenity.findMany({ where: { category: "ROOM" } }),
  ]);

  if (!room) notFound();

  const description = room.description as Record<string, string>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{room.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("photos")}</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomMediaManager
            locale={locale}
            organizationId={organization.id}
            hotelId={hotelId}
            roomId={room.id}
            media={room.media.map((m) => ({ id: m.id, url: m.url }))}
          />
        </CardContent>
      </Card>

      <RoomForm
        locale={locale}
        organizationId={organization.id}
        hotelId={hotelId}
        roomId={room.id}
        amenities={amenities.map((a) => ({
          id: a.id,
          name: pickLocaleText(a.name as Record<string, unknown>, locale),
        }))}
        defaultValues={{
          name: room.name,
          roomTypeLabel: room.roomTypeLabel,
          descriptionEn: description?.en ?? "",
          descriptionFr: description?.fr ?? "",
          descriptionAr: description?.ar ?? "",
          maxGuests: room.maxGuests,
          maxAdults: room.maxAdults,
          maxChildren: room.maxChildren,
          bedTypes: room.bedTypes as RoomInputBedType[],
          numberOfBeds: room.numberOfBeds,
          bathrooms: room.bathrooms,
          roomSizeSqm: room.roomSizeSqm ? Number(room.roomSizeSqm) : undefined,
          smokingAllowed: room.smokingAllowed,
          accessible: room.accessible,
          breakfastIncluded: room.breakfastIncluded,
          refundable: room.refundable,
          basePrice: Number(room.basePrice),
          weekendPrice: room.weekendPrice ? Number(room.weekendPrice) : undefined,
          taxRatePercent: Number(room.taxRatePercent),
          cleaningFee: Number(room.cleaningFee),
          currency: room.currency,
          availableQuantity: room.availableQuantity,
          minStay: room.minStay,
          maxStay: room.maxStay ?? undefined,
          instantBooking: room.instantBooking,
          amenityIds: room.amenities.map((a) => a.id),
        }}
      />

      <RoomAvailabilityManager
        locale={locale}
        organizationId={organization.id}
        hotelId={hotelId}
        roomId={room.id}
        seasonalPrices={room.seasonalPrices.map((s) => ({
          id: s.id,
          name: s.name,
          startDate: toDateInput(s.startDate),
          endDate: toDateInput(s.endDate),
          price: s.price.toString(),
        }))}
        blackoutDates={room.availabilityOverrides.map((o) => ({
          id: o.id,
          date: toDateInput(o.date),
          reason: o.reason,
        }))}
      />
    </div>
  );
}

type RoomInputBedType =
  | "SINGLE"
  | "TWIN"
  | "DOUBLE"
  | "QUEEN"
  | "KING"
  | "SOFA_BED"
  | "BUNK_BED";
