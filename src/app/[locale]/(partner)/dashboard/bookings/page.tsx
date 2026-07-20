import { getTranslations } from "next-intl/server";
import NextLink from "next/link";
import { Download } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReservationStatusSelect } from "@/components/partner/reservation-status-select";
import type { BookingStatus } from "@/generated/prisma/client";

export default async function PartnerBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const { status } = await searchParams;
  const t = await getTranslations("Partner");
  const tStatus = await getTranslations("BookingStatus");
  const { organization } = await getPartnerContext(locale);

  const reservations = await prisma.reservation.findMany({
    where: {
      organizationId: organization.id,
      ...(status ? { status: status as BookingStatus } : {}),
    },
    include: {
      hotelLink: { include: { hotel: true } },
      carLink: { include: { vehicle: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const statusOptions: (BookingStatus | "ALL")[] = [
    "ALL",
    "PENDING",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("bookings")}</h1>
        <Button variant="outline" render={<NextLink href="/api/partner/bookings/export" />}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <a
            key={option}
            href={option === "ALL" ? "?" : `?status=${option}`}
            className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            {option === "ALL" ? "All" : tStatus(option)}
          </a>
        ))}
      </div>

      {reservations.length === 0 ? (
        <p className="text-muted-foreground">{t("noBookingsYet")}</p>
      ) : (
        <div className="space-y-3">
          {reservations.map((reservation) => (
            <Card key={reservation.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium">
                    {reservation.type === "HOTEL"
                      ? reservation.hotelLink?.hotel.name
                      : `${reservation.carLink?.vehicle.brand} ${reservation.carLink?.vehicle.model}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {reservation.bookingReference} · {reservation.guestFirstName}{" "}
                    {reservation.guestLastName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium">
                    {formatMoney(reservation.totalAmount.toString(), reservation.currency, locale)}
                  </p>
                  <Badge variant="secondary">{tStatus(reservation.status)}</Badge>
                  <ReservationStatusSelect
                    locale={locale}
                    organizationId={organization.id}
                    reservationId={reservation.id}
                    currentStatus={reservation.status}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
