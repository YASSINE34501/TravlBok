import { getTranslations } from "next-intl/server";
import { getAdvancedAnalytics, type AnalyticsFilters } from "@/domains/reports/analytics";
import { getAnalyticsFilterOptions } from "@/domains/reports/filter-options";
import { formatMoney } from "@/lib/currency/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsFilterForm } from "@/components/admin/analytics-filter-form";
import { SubscriptionGrowthChart } from "@/components/admin/subscription-growth-chart";
import type { BookingStatus, CurrencyCode } from "@/generated/prisma/client";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">{value}</CardContent>
    </Card>
  );
}

export default async function AdminAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");
  const query = await searchParams;

  const filters: AnalyticsFilters = {
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    countryId: query.countryId,
    cityId: query.cityId,
    organizationId: query.organizationId,
    hotelId: query.hotelId,
    serviceType: query.serviceType as AnalyticsFilters["serviceType"],
    currency: query.currency as CurrencyCode | undefined,
    subscriptionPlanId: query.subscriptionPlanId,
    bookingStatus: query.bookingStatus as BookingStatus | undefined,
  };

  const [analytics, filterOptions] = await Promise.all([
    getAdvancedAnalytics(filters),
    getAnalyticsFilterOptions(),
  ]);

  const reportingCurrency = filters.currency ?? "MAD";
  const money = (amount: number) => formatMoney(String(amount), reportingCurrency, locale);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("advancedAnalytics")}</h1>
      <p className="text-sm text-muted-foreground">
        {analytics.range.dateFrom} → {analytics.range.dateTo}. Amounts are shown in{" "}
        {reportingCurrency} without cross-currency conversion — use the Currency filter to isolate
        a single currency&apos;s figures precisely; see Currency distribution below for the full split.
      </p>

      <AnalyticsFilterForm
        locale={locale}
        countries={filterOptions.countries}
        cities={filterOptions.cities}
        organizations={filterOptions.organizations}
        hotels={filterOptions.hotels}
        subscriptionPlans={filterOptions.subscriptionPlans}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Gross booking value" value={money(analytics.grossBookingValue)} />
        <StatCard label="Net revenue" value={money(analytics.netRevenue)} />
        <StatCard label="Commission revenue" value={money(analytics.commissionRevenue)} />
        <StatCard label="Subscription revenue" value={money(analytics.subscriptionRevenue)} />
        <StatCard label="Affiliate commissions paid/payable" value={money(analytics.affiliateCommissionsTotal)} />
        <StatCard label="Total bookings" value={String(analytics.totalBookings)} />
        <StatCard label="Cancellation rate" value={`${analytics.cancellationRatePercent}%`} />
        <StatCard label="Affiliate conversion rate" value={`${analytics.affiliateConversionRatePercent}%`} />
        <StatCard label="Occupancy rate (hotels)" value={`${analytics.occupancyRatePercent}%`} />
        <StatCard label="ADR" value={money(analytics.adr)} />
        <StatCard label="RevPAR" value={money(analytics.revpar)} />
        <StatCard label="Car utilization" value={`${analytics.carUtilizationPercent}%`} />
        <StatCard label="Avg. car rental duration" value={`${analytics.avgCarRentalDurationDays} day(s)`} />
        <StatCard label="Subscription churn rate" value={`${analytics.churnRatePercent}%`} />
        <StatCard label="New subscriptions" value={String(analytics.newSubscriptions)} />
        <StatCard label="Churned subscriptions" value={String(analytics.churnedSubscriptions)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription growth (net new, last 6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionGrowthChart data={analytics.subscriptionGrowthTrend} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Currency distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.currencyDistribution.map((row) => (
              <div key={row.currency} className="flex items-center justify-between text-sm">
                <span>{row.currency}</span>
                <span>
                  {formatMoney(String(row.amount), row.currency, locale)} · {row.count} payment(s)
                </span>
              </div>
            ))}
            {analytics.currencyDistribution.length === 0 && (
              <p className="text-sm text-muted-foreground">No payments in this range.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acquisition source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Affiliate-attributed</span>
              <span>{analytics.acquisitionSource.affiliateAttributed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Direct</span>
              <span>{analytics.acquisitionSource.direct}</span>
            </div>
            <div className="mt-3 border-t pt-2">
              {analytics.bookingSourceDistribution.map((row) => (
                <div key={row.source} className="flex items-center justify-between">
                  <span>{row.source}</span>
                  <span>{row.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top destinations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {analytics.topDestinations.map((row) => (
              <div key={row.cityId} className="flex items-center justify-between">
                <span>{row.cityName}</span>
                <span>
                  {row.bookings} · {money(row.revenue)}
                </span>
              </div>
            ))}
            {analytics.topDestinations.length === 0 && (
              <p className="text-muted-foreground">No bookings in this range.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top partners</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {analytics.topPartners.map((row) => (
              <div key={row.organizationId} className="flex items-center justify-between">
                <span>{row.name}</span>
                <span>
                  {row.bookings} · {money(row.revenue)}
                </span>
              </div>
            ))}
            {analytics.topPartners.length === 0 && (
              <p className="text-muted-foreground">No bookings in this range.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top affiliates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {analytics.topAffiliates.map((row) => (
              <div key={row.affiliateId} className="flex items-center justify-between">
                <span>{row.organizationName}</span>
                <span>{money(row.commissionTotal)}</span>
              </div>
            ))}
            {analytics.topAffiliates.length === 0 && (
              <p className="text-muted-foreground">No commissions in this range.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
