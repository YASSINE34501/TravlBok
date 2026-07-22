import { notFound } from "next/navigation";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { hasFeature } from "@/domains/subscriptions/limits";
import { getFrontDeskData } from "@/domains/pms/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
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

  const pmsEnabled = await hasFeature(organization.id, "featurePms");
  if (!pmsEnabled) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Front desk</h1>
        <p className="text-sm text-muted-foreground">
          The Property Management System is not included in your current subscription plan.
          Upgrade your plan to enable check-in/check-out, housekeeping, and PMS reports.
        </p>
      </div>
    );
  }

  const hotels = await prisma.hotel.findMany({
    where: { organizationId: organization.id, deletedAt: null },
    include: { roomTypes: { where: { isActive: true } } },
  });
  const hotel = requestedHotelId
    ? hotels.find((h) => h.id === requestedHotelId)
    : hotels[0];
  if (!hotel) notFound();

  const data = await getFrontDeskData(hotel.id);
  const roomsAvailableForCheckIn = data.roomInventory.filter(
    (r) => r.operationalStatus === "AVAILABLE" || r.operationalStatus === "READY"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Front desk — {hotel.name}</h1>
        <div className="flex items-center gap-2">
          {hotels.length > 1 &&
            hotels.map((h) => (
              <Link
                key={h.id}
                href={`/dashboard/pms?hotelId=${h.id}`}
                className={h.id === hotel.id ? "font-semibold underline" : "text-muted-foreground"}
              >
                {h.name}
              </Link>
            ))}
          <WalkInDialog
            locale={locale}
            organizationId={organization.id}
            hotelId={hotel.id}
            roomTypes={hotel.roomTypes.map((rt) => ({ id: rt.id, name: rt.name }))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(data.roomsByStatus).map(([status, count]) => (
          <Card key={status}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{status}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{count}</CardContent>
          </Card>
        ))}
      </div>

      {data.roomInventory.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Set up room inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <GenerateRoomInventoryForm
              locale={locale}
              organizationId={organization.id}
              hotelId={hotel.id}
              roomTypes={hotel.roomTypes.map((rt) => ({ id: rt.id, name: rt.name }))}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arrivals today ({data.arrivals.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.arrivals.map((reservation) => (
            <div
              key={reservation.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span>
                {reservation.guestFirstName} {reservation.guestLastName} ·{" "}
                {reservation.bookingReference}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{reservation.status}</Badge>
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
          {data.arrivals.length === 0 && (
            <p className="text-sm text-muted-foreground">No arrivals today.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Departures today ({data.departures.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.departures.map((checkIn) => (
            <div
              key={checkIn.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span>
                {checkIn.reservation.guestFirstName} {checkIn.reservation.guestLastName} · Room{" "}
                {checkIn.roomInventory.unitNumber}
              </span>
              <CheckOutDialog
                locale={locale}
                organizationId={organization.id}
                checkInId={checkIn.id}
                guestName={`${checkIn.reservation.guestFirstName} ${checkIn.reservation.guestLastName}`}
              />
            </div>
          ))}
          {data.departures.length === 0 && (
            <p className="text-sm text-muted-foreground">No departures today.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current guests ({data.currentGuests.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.currentGuests.map((checkIn) => (
            <div key={checkIn.id} className="rounded-md border px-3 py-2 text-sm">
              {checkIn.reservation.guestFirstName} {checkIn.reservation.guestLastName} · Room{" "}
              {checkIn.roomInventory.unitNumber}
            </div>
          ))}
          {data.currentGuests.length === 0 && (
            <p className="text-sm text-muted-foreground">No guests currently in-house.</p>
          )}
        </CardContent>
      </Card>

      {data.pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pending payments ({data.pendingPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.pendingPayments.map((payment) => (
              <div key={payment.id} className="rounded-md border px-3 py-2 text-sm">
                {payment.reservation?.bookingReference} · {payment.amount.toString()}{" "}
                {payment.currency}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
