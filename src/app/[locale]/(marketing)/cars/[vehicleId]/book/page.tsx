import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { CarBookingForm } from "@/components/booking/car-booking-form";

export default async function CarBookingPage({
  params,
}: {
  params: Promise<{ locale: string; vehicleId: string }>;
}) {
  const { locale, vehicleId } = await params;
  setRequestLocale(locale);

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, approvalStatus: "PUBLISHED", deletedAt: null },
  });
  if (!vehicle) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        {vehicle.brand} {vehicle.model}
      </h1>
      <div className="mt-6">
        <CarBookingForm locale={locale} vehicleId={vehicle.id} />
      </div>
    </main>
  );
}
