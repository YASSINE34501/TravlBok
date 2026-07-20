import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { HotelBookingForm } from "@/components/booking/hotel-booking-form";

export default async function HotelBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; hotelId: string }>;
  searchParams: Promise<{ roomTypeId?: string }>;
}) {
  const { locale, hotelId } = await params;
  const { roomTypeId } = await searchParams;
  setRequestLocale(locale);

  if (!roomTypeId) notFound();

  const roomType = await prisma.roomType.findFirst({
    where: { id: roomTypeId, hotelId, isActive: true, deletedAt: null },
    include: { hotel: true },
  });
  if (!roomType || roomType.hotel.status !== "PUBLISHED") notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{roomType.hotel.name}</h1>
      <p className="text-muted-foreground">{roomType.name}</p>
      <div className="mt-6">
        <HotelBookingForm locale={locale} roomTypeId={roomType.id} minStay={roomType.minStay} />
      </div>
    </main>
  );
}
