import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TrendingUp, DollarSign, Gauge, XCircle } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import {
  getOccupancyReport,
  getRevenueByRoomType,
  getCancellationsReport,
} from "@/domains/pms/reports";
import { formatMoney } from "@/lib/currency/format";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { DataTableShell } from "@/components/ui/data-table";
import { AreaChart } from "@/components/ui/charts/area-chart";
import { BarChart } from "@/components/ui/charts/bar-chart";
import type { ChartConfig } from "@/components/ui/charts/chart-container";
import { EmptyState } from "@/components/ui/empty-state";
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
  const t = await getTranslations("Pms");
  const tBookingStatus = await getTranslations("BookingStatus");

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

  const occupancyChartConfig: ChartConfig = {
    occupancyPercent: { label: t("avgOccupancy"), color: "var(--chart-1)" },
  };
  const revenueChartConfig: ChartConfig = {
    revenue: { label: t("revenueByRoomType"), color: "var(--chart-2)" },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("reports")}
        description={`${hotel.name} · ${t("last30Days")}`}
        actions={<ReportExportLinks locale={locale} hotelId={hotel.id} type="occupancy" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label={t("avgOccupancy")} value={`${avgOccupancy.toFixed(1)}%`} icon={Gauge} />
        <MetricCard
          label={t("avgAdr")}
          value={formatMoney(avgAdr.toFixed(2), "MAD", locale)}
          icon={DollarSign}
        />
        <MetricCard
          label={t("avgRevpar")}
          value={formatMoney(avgRevpar.toFixed(2), "MAD", locale)}
          icon={TrendingUp}
        />
      </div>

      <DataTableShell title={t("avgOccupancy")}>
        <div className="p-4 sm:p-5">
          {occupancy.length > 0 ? (
            <AreaChart
              data={occupancy}
              index="day"
              categories={["occupancyPercent"]}
              config={occupancyChartConfig}
              showLegend={false}
            />
          ) : (
            <EmptyState title={t("noRevenueInPeriod")} className="border-0 py-12" />
          )}
        </div>
      </DataTableShell>

      <DataTableShell title={t("revenueByRoomType")}>
        <div className="p-4 sm:p-5">
          {revenueByRoomType.length > 0 ? (
            <BarChart
              data={revenueByRoomType}
              index="roomTypeName"
              categories={["revenue"]}
              config={revenueChartConfig}
              showLegend={false}
              currency="MAD"
              locale={locale}
            />
          ) : (
            <EmptyState title={t("noRevenueInPeriod")} className="border-0 py-12" />
          )}
        </div>
      </DataTableShell>

      <DataTableShell title={`${t("cancellations")} (${cancellations.length})`}>
        {cancellations.length === 0 ? (
          <EmptyState icon={XCircle} title={t("noCancellations")} className="border-0 py-12" />
        ) : (
          <div className="divide-y">
            {cancellations.slice(0, 20).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <p className="text-sm text-foreground">
                  {r.bookingReference} · {r.guestFirstName} {r.guestLastName}
                </p>
                <p className="text-sm text-muted-foreground">{tBookingStatus(r.status)}</p>
              </div>
            ))}
          </div>
        )}
      </DataTableShell>
    </div>
  );
}
