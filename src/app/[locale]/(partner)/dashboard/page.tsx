import { getTranslations } from "next-intl/server";
import {
  DollarSign,
  BedDouble,
  LogIn,
  LogOut,
  Star,
  Car,
  Link2,
} from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { getHotelDashboardOverview } from "@/domains/hotels/analytics";
import {
  getCarRentalDashboardOverview,
  type CarRentalDashboardOverview,
} from "@/domains/vehicles/analytics";
import type { HotelDashboardOverview, RecentReservationRow } from "@/domains/hotels/analytics";
import { formatMoney } from "@/lib/currency/format";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { AreaChart } from "@/components/ui/charts/area-chart";
import { DonutChart } from "@/components/ui/charts/donut-chart";
import type { ChartConfig } from "@/components/ui/charts/chart-container";
import { DataTableShell } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RESERVATION_STATUS_TONE } from "@/lib/status-tones";
import type { BookingStatus } from "@/generated/prisma/client";


export default async function PartnerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Partner");
  const tStatus = await getTranslations("BookingStatus");
  const tPayments = await getTranslations("Payments");
  const tCommon = await getTranslations("Common");
  const tVerification = await getTranslations("PropertyStatus");
  const { organization } = await getPartnerContext(locale);

  if (organization.type === "AFFILIATE") {
    return (
      <div className="space-y-6">
        <PageHeader title={t("dashboard")} />
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Link2 className="size-5" />
              </span>
              <div>
                <p className="font-medium text-foreground">{t("affiliateOverview")}</p>
                <p className="text-sm text-muted-foreground">
                  {organization.displayName}
                </p>
              </div>
            </div>
            <Button render={<Link href="/dashboard/affiliate" />}>{t("affiliateOverview")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCarRental = organization.type === "CAR_RENTAL";
  const overview: HotelDashboardOverview | CarRentalDashboardOverview = isCarRental
    ? await getCarRentalDashboardOverview(organization.id)
    : await getHotelDashboardOverview(organization.id);

  const revenueChartConfig: ChartConfig = {
    revenue: { label: t("revenue"), color: "var(--chart-1)" },
  };
  const paymentStatusLabel: Record<string, string> = {
    PENDING: tPayments("statusPending"),
    PAID: tPayments("statusPaid"),
    FAILED: tPayments("statusFailed"),
  };
  const paymentChartConfig: ChartConfig = {
    PENDING: { label: paymentStatusLabel.PENDING, color: "var(--chart-4)" },
    PAID: { label: paymentStatusLabel.PAID, color: "var(--chart-3)" },
    FAILED: { label: paymentStatusLabel.FAILED, color: "var(--destructive)" },
  };
  const paymentChartData = overview.paymentStatusBreakdown.map((row) => ({
    name: row.status,
    value: row.count,
    color: `var(--color-${row.status})`,
  }));
  const totalPayments = overview.paymentStatusBreakdown.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard")}
        description={organization.displayName}
        actions={
          organization.verificationStatus !== "APPROVED" ? (
            <StatusBadge tone="warning">{tVerification(organization.verificationStatus)}</StatusBadge>
          ) : undefined
        }
      />

      {organization.verificationStatus !== "APPROVED" && (
        <Card className="rounded-2xl border-warning/40 bg-warning/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div>
              <p className="font-medium text-foreground">
                {t("orgStatusMessage", {
                  status: organization.verificationStatus.toLowerCase().replace("_", " "),
                })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t("orgStatusDescription")}</p>
            </div>
            <Button render={<Link href="/dashboard/organization" />}>
              {t("completeProfile")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={t("revenue")}
          value={formatMoney(overview.revenuePeriod.toString(), organization.baseCurrency, locale)}
          icon={DollarSign}
        />
        {isCarRental ? (
          <>
            <MetricCard
              label={t("fleetSize")}
              value={(overview as CarRentalDashboardOverview).fleetSize}
              icon={Car}
            />
            <MetricCard
              label={t("pickupsToday")}
              value={(overview as CarRentalDashboardOverview).pickupsToday}
              icon={LogIn}
            />
            <MetricCard
              label={t("returnsToday")}
              value={(overview as CarRentalDashboardOverview).returnsToday}
              icon={LogOut}
            />
          </>
        ) : (
          <>
            <MetricCard
              label={t("occupancy")}
              value={`${(overview as HotelDashboardOverview).occupancyPercent.toFixed(0)}%`}
              icon={BedDouble}
            />
            <MetricCard
              label={t("arrivalsToday")}
              value={(overview as HotelDashboardOverview).arrivalsToday}
              icon={LogIn}
            />
            <MetricCard
              label={t("departuresToday")}
              value={(overview as HotelDashboardOverview).departuresToday}
              icon={LogOut}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DataTableShell
          title={t("revenueTrend")}
          className="lg:col-span-2"
        >
          <div className="p-4 sm:p-5">
            {overview.series.length > 0 ? (
              <AreaChart
                data={overview.series}
                index="day"
                categories={["revenue"]}
                config={revenueChartConfig}
                showLegend={false}
                currency={organization.baseCurrency}
                locale={locale}
              />
            ) : (
              <EmptyState title={tCommon("noResults")} className="border-0 py-12" />
            )}
          </div>
        </DataTableShell>

        <DataTableShell title={t("paymentStatusBreakdown")}>
          <div className="flex flex-col items-center justify-center p-4 sm:p-5">
            {totalPayments > 0 ? (
              <DonutChart
                data={paymentChartData}
                config={paymentChartConfig}
                className="aspect-square max-h-56"
                centerLabel={
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-foreground">{totalPayments}</p>
                    <p className="text-xs text-muted-foreground">{tCommon("viewAll")}</p>
                  </div>
                }
              />
            ) : (
              <EmptyState title={tCommon("noResults")} className="border-0 py-12" />
            )}
          </div>
        </DataTableShell>
      </div>

      <DataTableShell
        title={t("recentReservations")}
        actions={
          <Button variant="ghost" render={<Link href="/dashboard/bookings" />}>
            {tCommon("viewAll")}
          </Button>
        }
      >
        {overview.recentReservations.length === 0 ? (
          <EmptyState
            icon={Star}
            title={t("noBookingsYet")}
            className="border-0 py-12"
          />
        ) : (
          <div className="divide-y">
            {overview.recentReservations.map((reservation: RecentReservationRow) => (
              <div
                key={reservation.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {reservation.propertyName || reservation.guestName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {reservation.bookingReference} · {reservation.guestName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {formatMoney(reservation.totalAmount.toString(), reservation.currency, locale)}
                  </p>
                  <StatusBadge tone={RESERVATION_STATUS_TONE[reservation.status as BookingStatus]}>
                    {tStatus(reservation.status)}
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </DataTableShell>
    </div>
  );
}
