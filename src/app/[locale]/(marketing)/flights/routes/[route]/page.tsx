import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { TrendingUp, Plane } from "lucide-react";
import { resolveRouteSlug, buildRouteSlug } from "@/lib/flights/slugs";
import { getPopularRoutes } from "@/domains/distribution/providers/aviasales-landing";
import { getRoutePageData, hasSufficientFlightContent } from "@/domains/distribution/providers/aviasales-content";
import { FlightSearchForm } from "@/components/flights/flight-search-form";
import { FlightCard } from "@/components/flights/flight-card";
import { FareCard } from "@/components/flights/fare-card";
import { MonthlyPriceStrip } from "@/components/flights/monthly-price-strip";
import { AirlineChipList } from "@/components/flights/airline-chip-list";
import { CachedPriceNotice } from "@/components/flights/cached-price-notice";
import { FlightsFaqSection } from "@/components/flights/flights-faq-section";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import { buildItemListJsonLd } from "@/lib/seo/item-list-jsonld";
import { buildFlightsPageMetadata } from "@/lib/seo/flights-metadata";
import { getDisplayCurrencyContext, formatFromBase } from "@/lib/currency/display";
import { getAppUrl } from "@/lib/env";
import { resolveCity } from "@/lib/travelpayouts/cities";

const HOME_ORIGIN = "CMN";
const STATIC_ROUTES_LIMIT = 30;

/** Bounded, real seed set (CMN → each of TravlBok's real popular routes) — any other real origin/destination pair still renders on demand. */
export async function generateStaticParams() {
  const homeCity = await resolveCity(HOME_ORIGIN);
  if (!homeCity) return [];
  const routes = await getPopularRoutes(HOME_ORIGIN, STATIC_ROUTES_LIMIT).catch(() => []);
  return routes.map((route) => ({ route: buildRouteSlug(homeCity.name, route.destinationName) }));
}

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; route: string }>;
}): Promise<Metadata> {
  const { locale, route: routeSlug } = await params;
  const resolved = await resolveRouteSlug(routeSlug);
  if (!resolved) return {};

  const t = await getTranslations({ locale, namespace: "FlightsContent" });
  const data = await getRoutePageData(resolved.origin.code, resolved.destination.code);

  return buildFlightsPageMetadata({
    locale,
    path: `/flights/routes/${routeSlug}`,
    title: t("routeMetaTitle", { origin: resolved.origin.name, destination: resolved.destination.name }),
    description: t("routeMetaDescription", {
      origin: resolved.origin.name,
      destination: resolved.destination.name,
      originCode: resolved.origin.code,
      destinationCode: resolved.destination.code,
    }),
    index: hasSufficientFlightContent(data),
  });
}

export default async function FlightRoutePage({
  params,
}: {
  params: Promise<{ locale: string; route: string }>;
}) {
  const { locale, route: routeSlug } = await params;
  setRequestLocale(locale);

  const resolved = await resolveRouteSlug(routeSlug);
  if (!resolved) notFound();
  const { origin, destination } = resolved;

  const [t, tNav, tLanding, data, similarRoutes, { currency, rates }] = await Promise.all([
    getTranslations({ locale, namespace: "FlightsContent" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "FlightsLanding" }),
    getRoutePageData(origin.code, destination.code),
    getPopularRoutes(origin.code, 6).catch(() => []),
    getDisplayCurrencyContext(),
  ]);

  const price = (amount: number) => formatFromBase(amount, "USD", currency, rates, locale);
  const appUrl = getAppUrl();

  const breadcrumbItems = [
    { label: tNav("flights"), href: "/flights" },
    { label: `${origin.name} → ${destination.name}` },
  ];

  const faqItems = [
    { q: tLanding("faqAccuracyQuestion"), a: tLanding("faqAccuracyAnswer") },
    { q: tLanding("faqBookingQuestion"), a: tLanding("faqBookingAnswer") },
    { q: tLanding("faqPaymentQuestion"), a: tLanding("faqPaymentAnswer") },
    { q: tLanding("faqChangesQuestion"), a: tLanding("faqChangesAnswer") },
  ];

  const itemListJsonLd = buildItemListJsonLd(
    data.exactFares.slice(0, 10).map((offer) => ({
      name: `${offer.airlineName} ${offer.originCode} → ${offer.destinationCode}`,
      url: `${appUrl}/${locale}/flights/offers/${offer.id}`,
    }))
  );

  const otherRoutes = similarRoutes.filter((route) => route.destinationCode !== destination.code).slice(0, 4);
  const initialOrigin = { code: origin.code, label: origin.name };
  const initialDestination = { code: destination.code, label: destination.name };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <JsonLd data={buildBreadcrumbJsonLd(locale, breadcrumbItems)} />
      {data.exactFares.length > 0 && <JsonLd data={itemListJsonLd} />}

      <BreadcrumbNav items={breadcrumbItems} />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {origin.name} ({origin.code})
            </span>
            <Plane className="size-3.5 rtl:-scale-x-100" />
            <span className="font-semibold text-foreground">
              {destination.name} ({destination.code})
            </span>
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("routePageTitle", { origin: origin.name, destination: destination.name })}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {t("routePageIntro", { origin: origin.name, destination: destination.name })}
          </p>
          {data.lowestPriceAmount !== null && (
            <p className="mt-3 text-sm font-medium text-foreground">
              {t("lowestPriceLabel", { price: price(data.lowestPriceAmount) })}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <FlightSearchForm initialOrigin={initialOrigin} initialDestination={initialDestination} />
      </div>

      <div className="mt-8">
        <CachedPriceNotice locale={locale} />
      </div>

      {data.fares.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">{t("recentlyFoundFaresTitle")}</h2>
          <div className="mt-4 space-y-3">
            {data.fares.slice(0, 10).map((offer) => (
              <FlightCard key={offer.id} offer={offer} locale={locale} />
            ))}
          </div>
        </section>
      )}

      <MonthlyPriceStrip
        title={tLanding("bestPricesByMonthTitle", { destination: destination.name })}
        monthlyPrices={data.monthlyPrices}
        locale={locale}
        formatPrice={price}
      />

      {data.airlines.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight">{tLanding("featuredAirlinesTitle")}</h2>
          </div>
          <div className="mt-4">
            <AirlineChipList airlineNames={data.airlines} />
          </div>
        </section>
      )}

      {otherRoutes.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">{t("similarRoutesTitle")}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {otherRoutes.map((route) => (
              <FareCard
                key={route.destinationCode}
                href={`/flights/routes/${buildRouteSlug(origin.name, route.destinationName)}`}
                originCode={origin.code}
                destinationCode={route.destinationCode}
                title={route.destinationName}
                priceLabel={price(route.priceAmount)}
                subtitle={route.airlineName}
              />
            ))}
          </div>
        </section>
      )}

      <FlightsFaqSection title={tLanding("faqTitle")} items={faqItems} />
    </main>
  );
}
