import { getTranslations } from "next-intl/server";
import NextLink from "next/link";
import { Download, CalendarX } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { DataTableShell } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ReservationStatusSelect } from "@/components/partner/reservation-status-select";
import { RESERVATION_STATUS_TONE } from "@/lib/status-tones";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
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
  const tCommon = await getTranslations("Common");
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
      <PageHeader
        title={t("bookings")}
        actions={
          <Button variant="outline" render={<NextLink href="/api/partner/bookings/export" />}>
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      <DataTableShell
        toolbar={
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <Link
                key={option}
                href={option === "ALL" ? "/dashboard/bookings" : `/dashboard/bookings?status=${option}`}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  (option === "ALL" && !status) || status === option
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {option === "ALL" ? tCommon("viewAll") : tStatus(option)}
              </Link>
            ))}
          </div>
        }
      >
        {reservations.length === 0 ? (
          <EmptyState icon={CalendarX} title={t("noBookingsYet")} className="border-0 py-12" />
        ) : (
          <div className="divide-y">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"
              >
                <div>
                  <p className="font-medium text-foreground">
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
                  <p className="text-sm font-medium text-foreground">
                    {formatMoney(reservation.totalAmount.toString(), reservation.currency, locale)}
                  </p>
                  <StatusBadge tone={RESERVATION_STATUS_TONE[reservation.status]}>
                    {tStatus(reservation.status)}
                  </StatusBadge>
                  <ReservationStatusSelect
                    locale={locale}
                    organizationId={organization.id}
                    reservationId={reservation.id}
                    currentStatus={reservation.status}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </DataTableShell>
    </div>
  );
}
