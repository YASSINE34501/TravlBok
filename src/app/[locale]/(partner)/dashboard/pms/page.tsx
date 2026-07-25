import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Lock, LogIn, LogOut, Users, Wallet, BedDouble } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { hasFeature } from "@/domains/subscriptions/limits";
import { getFrontDeskData } from "@/domains/pms/queries";
import { formatMoney } from "@/lib/currency/format";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { DataTableShell } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RESERVATION_STATUS_TONE, ROOM_OPERATIONAL_STATUS_TONE } from "@/lib/status-tones";
import type { BookingStatus, RoomOperationalStatus } from "@/generated/prisma/client";
import { CheckInDialog } from "@/components/partner/check-in-dialog";
import { CheckOutDialog } from "@/components/partner/check-out-dialog";
import { WalkInDialog } from "@/components/partner/walk-in-dialog";
import { GenerateRoomInventoryForm } from "@/components/partner/generate-room-inventory-form";

export default async function PmsFrontDeskPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ hotelId?: string }>;
}) {
  const { locale } = await params;
  const { hotelId: requestedHotelId } = await searchParams;
  const { organization } = await getPartnerContext(locale);
  const t = await getTranslations("Pms");
  const tStatus = await getTranslations("BookingStatus");
  const tRoomStatus = await getTranslations("RoomOperationalStatus");

  const pmsEnabled = await hasFeature(organization.id, "featurePms");
  if (!pmsEnabled) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("frontDesk")} />
        <EmptyState icon={Lock} title={t("frontDesk")} description={t("upgradeRequiredDescription")} />
      </div>
    );
  }

  const hotels = await prisma.hotel.findMany({
    where: { organizationId: organization.id, deletedAt: null },
    include: { roomTypes: { where: { isActive: true } } },
  });
  const hotel = requestedHotelId ? hotels.find((h) => h.id === requestedHotelId) : hotels[0];
  if (!hotel) notFound();

  const data = await getFrontDeskData(hotel.id);
  const roomsAvailableForCheckIn = data.roomInventory.filter(
    (r) => r.operationalStatus === "AVAILABLE" || r.operationalStatus === "READY"
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("frontDesk")}
        description={hotel.name}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {hotels.length > 1 && (
              <div className="flex items-center gap-1 rounded-lg border p-1">
                {hotels.map((h) => (
                  <Button
                    key={h.id}
                    size="sm"
                    variant={h.id === hotel.id ? "secondary" : "ghost"}
                    render={<Link href={`/dashboard/pms?hotelId=${h.id}`} />}
                  >
                    {h.name}
                  </Button>
                ))}
              </div>
            )}
            <WalkInDialog
              locale={locale}
              organizationId={organization.id}
              hotelId={hotel.id}
              roomTypes={hotel.roomTypes.map((rt) => ({ id: rt.id, name: rt.name }))}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label={t("arrivalsToday")} value={data.arrivals.length} icon={LogIn} />
        <MetricCard label={t("departuresToday")} value={data.departures.length} icon={LogOut} />
        <MetricCard label={t("currentGuests")} value={data.currentGuests.length} icon={Users} />
        <MetricCard label={t("pendingPayments")} value={data.pendingPayments.length} icon={Wallet} />
      </div>

      {data.roomInventory.length === 0 ? (
        <DataTableShell title={t("setupRoomInventory")}>
          <div className="p-4 sm:p-5">
            <GenerateRoomInventoryForm
              locale={locale}
              organizationId={organization.id}
              hotelId={hotel.id}
              roomTypes={hotel.roomTypes.map((rt) => ({ id: rt.id, name: rt.name }))}
            />
          </div>
        </DataTableShell>
      ) : (
        <DataTableShell title={t("roomStatus")}>
          <div className="flex flex-wrap gap-2 p-4 sm:p-5">
            {Object.entries(data.roomsByStatus).map(([status, count]) => (
              <StatusBadge key={status} tone={ROOM_OPERATIONAL_STATUS_TONE[status as RoomOperationalStatus]}>
                {tRoomStatus(status)} · {count}
              </StatusBadge>
            ))}
          </div>
        </DataTableShell>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DataTableShell title={`${t("arrivalsToday")} (${data.arrivals.length})`}>
          {data.arrivals.length === 0 ? (
            <EmptyState icon={LogIn} title={t("noArrivalsToday")} className="border-0 py-10" />
          ) : (
            <div className="divide-y">
              {data.arrivals.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {reservation.guestFirstName} {reservation.guestLastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{reservation.bookingReference}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={RESERVATION_STATUS_TONE[reservation.status as BookingStatus]}>
                      {tStatus(reservation.status)}
                    </StatusBadge>
                    {!reservation.checkIn && (
                      <CheckInDialog
                        locale={locale}
                        organizationId={organization.id}
                        reservationId={reservation.id}
                        guestName={`${reservation.guestFirstName} ${reservation.guestLastName}`}
                        availableRooms={roomsAvailableForCheckIn.map((r) => ({
                          id: r.id,
                          unitNumber: r.unitNumber,
                        }))}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DataTableShell>

        <DataTableShell title={`${t("departuresToday")} (${data.departures.length})`}>
          {data.departures.length === 0 ? (
            <EmptyState icon={LogOut} title={t("noDeparturesToday")} className="border-0 py-10" />
          ) : (
            <div className="divide-y">
              {data.departures.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {checkIn.reservation.guestFirstName} {checkIn.reservation.guestLastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("roomType")} {checkIn.roomInventory.unitNumber}
                    </p>
                  </div>
                  <CheckOutDialog
                    locale={locale}
                    organizationId={organization.id}
                    checkInId={checkIn.id}
                    guestName={`${checkIn.reservation.guestFirstName} ${checkIn.reservation.guestLastName}`}
                  />
                </div>
              ))}
            </div>
          )}
        </DataTableShell>
      </div>

      <DataTableShell title={`${t("currentGuests")} (${data.currentGuests.length})`}>
        {data.currentGuests.length === 0 ? (
          <EmptyState icon={BedDouble} title={t("noGuestsInHouse")} className="border-0 py-10" />
        ) : (
          <div className="divide-y">
            {data.currentGuests.map((checkIn) => (
              <div key={checkIn.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <p className="font-medium text-foreground">
                  {checkIn.reservation.guestFirstName} {checkIn.reservation.guestLastName}
                </p>
                <StatusBadge tone="info">{checkIn.roomInventory.unitNumber}</StatusBadge>
              </div>
            ))}
          </div>
        )}
      </DataTableShell>

      {data.pendingPayments.length > 0 && (
        <DataTableShell title={`${t("pendingPayments")} (${data.pendingPayments.length})`}>
          <div className="divide-y">
            {data.pendingPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <p className="text-sm text-foreground">{payment.reservation?.bookingReference}</p>
                <p className="text-sm font-medium text-foreground">
                  {formatMoney(payment.amount.toString(), payment.currency, locale)}
                </p>
              </div>
            ))}
          </div>
        </DataTableShell>
      )}
    </div>
  );
}
