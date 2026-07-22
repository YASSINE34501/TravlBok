import { notFound } from "next/navigation";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import {
  getOccupancyReport,
  getRevenueByRoomType,
  getCancellationsReport,
} from "@/domains/pms/reports";
import { formatMoney } from "@/lib/currency/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportExportLinks } from "@/components/partner/report-export-links";

export default async function PmsReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ hotelId?: string }>;
}) {
  const { locale } = await params;
  const { hotelId: requestedHotelId } = await searchParams;
  const { organization } = await getPartnerContext(locale);

  const hotels = await prisma.hotel.findMany({
    where: { organizationId: organization.id, deletedAt: null },
  });
  const hotel = requestedHotelId ? hotels.find((h) => h.id === requestedHotelId) : hotels[0];
  if (!hotel) notFound();

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const [occupancy, revenueByRoomType, cancellations] = await Promise.all([
    getOccupancyReport(hotel.id, startDate, endDate),
    getRevenueByRoomType(hotel.id, startDate, endDate),
    getCancellationsReport(hotel.id),
  ]);

  const avgOccupancy =
    occupancy.length > 0
      ? occupancy.reduce((sum, r) => sum + r.occupancyPercent, 0) / occupancy.length
      : 0;
  const avgAdr =
    occupancy.filter((r) => r.roomsSold > 0).reduce((sum, r) => sum + r.adr, 0) /
    (occupancy.filter((r) => r.roomsSold > 0).length || 1);
  const avgRevpar =
    occupancy.length > 0 ? occupancy.reduce((sum, r) => sum + r.revpar, 0) / occupancy.length : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reports — {hotel.name} (last 30 days)</h1>
      <ReportExportLinks locale={locale} hotelId={hotel.id} type="occupancy" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Avg. Occupancy</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{avgOccupancy.toFixed(1)}%</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Avg. ADR</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(avgAdr.toFixed(2), "MAD", locale)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Avg. RevPAR</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(avgRevpar.toFixed(2), "MAD", locale)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by room type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {revenueByRoomType.map((row) => (
            <div key={row.roomTypeName} className="flex items-center justify-between text-sm">
              <span>
                {row.roomTypeName} ({row.roomsSold} rooms)
              </span>
              <span>{formatMoney(row.revenue.toFixed(2), "MAD", locale)}</span>
            </div>
          ))}
          {revenueByRoomType.length === 0 && (
            <p className="text-sm text-muted-foreground">No revenue in this period.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cancellations ({cancellations.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cancellations.slice(0, 20).map((r) => (
            <div key={r.id} className="flex items-center justify-between text-sm">
              <span>
                {r.bookingReference} · {r.guestFirstName} {r.guestLastName}
              </span>
              <span className="text-muted-foreground">{r.status}</span>
            </div>
          ))}
          {cancellations.length === 0 && (
            <p className="text-sm text-muted-foreground">No cancellations.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
