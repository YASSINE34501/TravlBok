import { getTranslations } from "next-intl/server";
import { CalendarX } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RESERVATION_STATUS_TONE } from "@/lib/status-tones";

export default async function AccountBookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireUser(locale);
  const t = await getTranslations("Booking");
  const tStatus = await getTranslations("BookingStatus");
  const tCommon = await getTranslations("Common");

  const reservations = await prisma.reservation.findMany({
    where: { customerUserId: user.id },
    include: { hotelLink: { include: { hotel: true } }, carLink: { include: { vehicle: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("bookingHistory")}</h1>

      {reservations.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={CalendarX} title={tCommon("noResults")} />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {reservations.map((reservation) => (
            <Link key={reservation.id} href={`/bookings/${reservation.id}`}>
              <Card className="rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-foreground">
                      {reservation.type === "HOTEL"
                        ? reservation.hotelLink?.hotel.name
                        : `${reservation.carLink?.vehicle.brand} ${reservation.carLink?.vehicle.model}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reservation.bookingReference}
                    </p>
                  </div>
                  <div className="text-end">
                    <StatusBadge tone={RESERVATION_STATUS_TONE[reservation.status]}>
                      {tStatus(reservation.status)}
                    </StatusBadge>
                    <p className="mt-1.5 text-sm font-medium text-foreground">
                      {formatMoney(
                        reservation.totalAmount.toString(),
                        reservation.currency,
                        locale
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
