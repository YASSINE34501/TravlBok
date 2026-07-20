import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";

export default async function AccountBookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireUser(locale);
  const t = await getTranslations("Booking");
  const tStatus = await getTranslations("BookingStatus");

  const reservations = await prisma.reservation.findMany({
    where: { customerUserId: user.id },
    include: { hotelLink: { include: { hotel: true } }, carLink: { include: { vehicle: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{t("bookingHistory")}</h1>

      {reservations.length === 0 ? (
        <div className="mt-8">
          <EmptyState />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {reservations.map((reservation) => (
            <Link key={reservation.id} href={`/bookings/${reservation.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">
                      {reservation.type === "HOTEL"
                        ? reservation.hotelLink?.hotel.name
                        : `${reservation.carLink?.vehicle.brand} ${reservation.carLink?.vehicle.model}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reservation.bookingReference}
                    </p>
                  </div>
                  <div className="text-end">
                    <Badge variant="secondary">{tStatus(reservation.status)}</Badge>
                    <p className="mt-1 text-sm font-medium">
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
