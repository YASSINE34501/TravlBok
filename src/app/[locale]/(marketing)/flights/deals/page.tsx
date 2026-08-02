import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PlaneTakeoff, Wallet, Plane, MapPin, CalendarDays } from "lucide-react";
import { getDealsPageData } from "@/domains/distribution/providers/aviasales-content";
import { slugify } from "@/lib/flights/slugs";
import { isDistributionConfigured } from "@/domains/distribution/providers/registry";
import { getFlightsDealsThresholdUsd } from "@/lib/env";
import { FareCard } from "@/components/flights/fare-card";
import { DealsFilterGrid } from "@/components/flights/deals-filter-grid";
import { MonthlyPriceStrip } from "@/components/flights/monthly-price-strip";
import { CachedPriceNotice } from "@/components/flights/cached-price-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import { buildFlightsPageMetadata } from "@/lib/seo/flights-metadata";
import { getDisplayCurrencyContext, formatFromBase } from "@/lib/currency/display";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FlightsContent" });
  const configured = isDistributionConfigured("FLIGHT");
  const data = configured ? await getDealsPageData(getFlightsDealsThresholdUsd()) : null;
  const hasContent = Boolean(data && (data.cheapest.length > 0 || data.popularDestinations.length > 0));

  return buildFlightsPageMetadata({
    locale,
    path: "/flights/deals",
    title: t("dealsMetaTitle"),
    description: t("dealsMetaDescription"),
    index: hasContent,
  });
}

export default async function FlightDealsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tNav, tLanding, { currency, rates }] = await Promise.all([
    getTranslations({ locale, namespace: "FlightsContent" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "FlightsLanding" }),
    getDisplayCurrencyContext(),
  ]);

  const price = (amount: number) => formatFromBase(amount, "USD", currency, rates, locale);
  const configured = isDistributionConfigured("FLIGHT");
  const threshold = getFlightsDealsThresholdUsd();
  const data = configured ? await getDealsPageData(threshold) : null;

  const breadcrumbItems = [
    { label: tNav("flights"), href: "/flights" },
    { label: tNav("deals") },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <JsonLd data={buildBreadcrumbJsonLd(locale, breadcrumbItems)} />
      <BreadcrumbNav items={breadcrumbItems} />

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{t("dealsPageTitle")}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{t("dealsPageIntro")}</p>

      <div className="mt-8">
        <CachedPriceNotice locale={locale} />
      </div>

      {!configured || !data || data.cheapest.length === 0 ? (
        <EmptyState
          icon={PlaneTakeoff}
          title={t("dealsUnavailableTitle")}
          description={t("dealsUnavailableDescription")}
          className="mt-8"
        />
      ) : (
        <>
          <section className="mt-10">
            <h2 className="text-2xl font-semibold tracking-tight">{t("dealsCheapestTitle")}</h2>
            <DealsFilterGrid deals={data.cheapest} locale={locale} currency={currency} rates={rates} />
          </section>

          {data.underThreshold.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center gap-2">
                <Wallet className="size-5 text-primary" />
                <h2 className="text-2xl font-semibold tracking-tight">
                  {t("dealsUnderThresholdTitle", { amount: price(threshold) })}
                </h2>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {data.underThreshold.map((deal, index) => (
                  <FareCard
                    key={`${deal.destinationCode}-under-${index}`}
                    href={`/flights?origin=${data.homeOriginCode}&destination=${deal.destinationCode}&departDate=${deal.departDate}&passengers=1`}
                    title={deal.destinationName}
                    priceLabel={price(deal.priceAmount)}
                  />
                ))}
              </div>
            </section>
          )}

          {data.directOnly.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center gap-2">
                <Plane className="size-5 text-primary" />
                <h2 className="text-2xl font-semibold tracking-tight">{t("dealsDirectTitle")}</h2>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {data.directOnly.map((deal, index) => (
                  <FareCard
                    key={`${deal.destinationCode}-direct-${index}`}
                    href={`/flights?origin=${data.homeOriginCode}&destination=${deal.destinationCode}&departDate=${deal.departDate}&passengers=1`}
                    title={deal.destinationName}
                    priceLabel={price(deal.priceAmount)}
                  />
                ))}
              </div>
            </section>
          )}

          {data.oneWay.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" />
                <h2 className="text-2xl font-semibold tracking-tight">{t("dealsOneWayTitle")}</h2>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {data.oneWay.map((deal, index) => (
                  <FareCard
                    key={`${deal.destinationCode}-oneway-${index}`}
                    href={`/flights?origin=${data.homeOriginCode}&destination=${deal.destinationCode}&departDate=${deal.departDate}&passengers=1`}
                    title={deal.destinationName}
                    priceLabel={price(deal.priceAmount)}
                  />
                ))}
              </div>
            </section>
          )}

          {data.popularDestinations.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center gap-2">
                <MapPin className="size-5 text-primary" />
                <h2 className="text-2xl font-semibold tracking-tight">{tLanding("topDestinationsTitle")}</h2>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {data.popularDestinations.map((destination) => (
                  <FareCard
                    key={destination.code}
                    href={`/flights/destinations/${slugify(destination.name)}`}
                    title={destination.name}
                    priceLabel={t("startingFromPriceShort", { price: price(destination.fromPriceAmount) })}
                  />
                ))}
              </div>
            </section>
          )}

          {data.monthlyByDestination.map((entry) => (
            <MonthlyPriceStrip
              key={entry.destinationCode}
              title={tLanding("bestPricesByMonthTitle", { destination: entry.destinationName })}
              monthlyPrices={entry.monthlyPrices}
              locale={locale}
              formatPrice={price}
            />
          ))}
        </>
      )}
    </main>
  );
}
