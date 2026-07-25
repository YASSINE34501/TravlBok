import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight, CalendarClock } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { getRoomRackData } from "@/domains/pms/queries";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { DataTableShell } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const DAYS_IN_VIEW = 14;

function toDateOnly(value: string | undefined): Date {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

function shiftDate(date: Date, days: number): string {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

export default async function PmsCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ hotelId?: string; start?: string }>;
}) {
  const { locale } = await params;
  const { hotelId: requestedHotelId, start } = await searchParams;
  const { organization } = await getPartnerContext(locale);
  const t = await getTranslations("Pms");

  const hotels = await prisma.hotel.findMany({
    where: { organizationId: organization.id, deletedAt: null },
  });
  const hotel = requestedHotelId ? hotels.find((h) => h.id === requestedHotelId) : hotels[0];
  if (!hotel) notFound();

  const startDate = toDateOnly(start);
  const { dayKeys, rows, unassignedReservations } = await getRoomRackData(
    hotel.id,
    startDate,
    DAYS_IN_VIEW
  );

  const dayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric" });
  const rangeParams = (newStart: string) =>
    `/dashboard/pms/calendar?hotelId=${hotel.id}&start=${newStart}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("calendar")}
        description={hotel.name}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={t("previousPeriod")}
              render={<Link href={rangeParams(shiftDate(startDate, -DAYS_IN_VIEW))} />}
            >
              <ChevronLeft className="size-4 rtl:hidden" />
              <ChevronRight className="hidden size-4 rtl:block" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={rangeParams(new Date().toISOString().slice(0, 10))} />}
            >
              {t("today")}
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={t("nextPeriod")}
              render={<Link href={rangeParams(shiftDate(startDate, DAYS_IN_VIEW))} />}
            >
              <ChevronRight className="size-4 rtl:hidden" />
              <ChevronLeft className="hidden size-4 rtl:block" />
            </Button>
          </div>
        }
      />

      <DataTableShell title={t("roomRack")}>
        {rows.length === 0 ? (
          <EmptyState icon={CalendarClock} title={t("setupRoomInventory")} className="border-0 py-12" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky start-0 bg-card">{t("roomType")}</TableHead>
                {dayKeys.map((day) => (
                  <TableHead key={day} className="text-center">
                    {dayFormatter.format(new Date(`${day}T00:00:00.000Z`))}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((room) => (
                <TableRow key={room.roomId}>
                  <TableCell className="sticky start-0 bg-card font-medium text-foreground">
                    {room.unitNumber}
                    <span className="ms-1.5 font-normal text-muted-foreground">
                      · {room.roomTypeName}
                    </span>
                  </TableCell>
                  {room.days.map((day) => (
                    <TableCell key={day.date} className="p-1 text-center">
                      {day.occupied ? (
                        <span
                          title={`${day.guestName ?? ""} · ${day.bookingReference ?? ""}`}
                          className={cn(
                            "block truncate rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                          )}
                        >
                          {day.guestName}
                        </span>
                      ) : (
                        <span className="block rounded-md px-2 py-1 text-xs text-muted-foreground">
                          —
                        </span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTableShell>

      <DataTableShell title={t("unassignedReservations")} description={t("unassignedReservationsDescription")}>
        {unassignedReservations.length === 0 ? (
          <EmptyState title={t("noUnassignedReservations")} className="border-0 py-10" />
        ) : (
          <div className="divide-y">
            {unassignedReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {reservation.guestFirstName} {reservation.guestLastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {reservation.bookingReference} ·{" "}
                    {reservation.roomItems.map((item) => item.roomType.name).join(", ")}
                  </p>
                </div>
                <StatusBadge tone="warning">
                  {reservation.checkInDate?.toLocaleDateString(locale)} –{" "}
                  {reservation.checkOutDate?.toLocaleDateString(locale)}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </DataTableShell>
    </div>
  );
}
