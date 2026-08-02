import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { MapPin, TrendingUp, Plane } from "lucide-react";
import { resolveDestinationSlug, slugify, buildRouteSlug } from "@/lib/flights/slugs";
import { getTopDestinations } from "@/domains/distribution/providers/aviasales-landing";
import { getDestinationPageData, hasSufficientFlightContent } from "@/domains/distribution/providers/aviasales-content";
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

const HOME_ORIGIN = "CMN";
const STATIC_DESTINATIONS_LIMIT = 40;

/** Bounded, real seed set for build-time generation — any other real destination slug still renders on demand (see `dynamicParams` below). */
export async function generateStaticParams() {
  const destinations = await getTopDestinations(HOME_ORIGIN, STATIC_DESTINATIONS_LIMIT).catch(() => []);
  return destinations.map((destination) => ({ destination: slugify(destination.name) }));
}

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; destination: string }>;
}): Promise<Metadata> {
  const { locale, destination: destinationSlug } = await params;
  const city = await resolveDestinationSlug(destinationSlug);
  if (!city) return {};

  const t = await getTranslations({ locale, namespace: "FlightsContent" });
  const data = await getDestinationPageData(city.code);

  return buildFlightsPageMetadata({
    locale,
    path: `/flights/destinations/${destinationSlug}`,
    title: t("destinationMetaTitle", { destination: city.name }),
    description: t("destinationMetaDescription", { destination: city.name, code: city.code }),
    index: hasSufficientFlightContent(data),
  });
}

export default async function FlightDestinationPage({
  params,
}: {
  params: Promise<{ locale: string; destination: string }>;
}) {
  const { locale, destination: destinationSlug } = await params;
  setRequestLocale(locale);

  const city = await resolveDestinationSlug(destinationSlug);
  if (!city) notFound();

  const [t, tNav, tFlights, tLanding, data, { currency, rates }] = await Promise.all([
    getTranslations({ locale, namespace: "FlightsContent" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Flights" }),
    getTranslations({ locale, namespace: "FlightsLanding" }),
    getDestinationPageData(city.code),
    getDisplayCurrencyContext(),
  ]);

  const price = (amount: number) => formatFromBase(amount, "USD", currency, rates, locale);
  const appUrl = getAppUrl();

  const breadcrumbItems = [
    { label: tNav("flights"), href: "/flights" },
    { label: city.name },
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

  const routeSlug = buildRouteSlug(data.homeCityName, city.name);
  const initialOrigin = { code: data.homeOriginCode, label: data.homeCityName };
  const initialDestination = { code: city.code, label: city.name };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <JsonLd data={buildBreadcrumbJsonLd(locale, breadcrumbItems)} />
      {data.exactFares.length > 0 && <JsonLd data={itemListJsonLd} />}

      <BreadcrumbNav items={breadcrumbItems} />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            <span>
              {city.countryCode} · {city.code}
            </span>
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("destinationPageTitle", { destination: city.name })}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {t("destinationPageIntro", { destination: city.name, country: city.countryCode, code: city.code })}
          </p>
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

      {data.exactFares.length > 0 && (
        <section className="mt-10 rounded-2xl border bg-muted/30 p-6">
          <h2 className="text-lg font-semibold">
            {t("flyingFromTitle", { city: data.homeCityName })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("flyingFromDescription", { origin: data.homeCityName, destination: city.name })}
          </p>
          <FareCard
            href={`/flights/routes/${routeSlug}`}
            originCode={data.homeOriginCode}
            destinationCode={city.code}
            title={`${data.homeCityName} → ${city.name}`}
            priceLabel={
              data.lowestPriceAmount !== null ? price(data.lowestPriceAmount) : ""
            }
            subtitle={tFlights("recentlyFoundTag")}
          />
        </section>
      )}

      <MonthlyPriceStrip
        title={tLanding("bestPricesByMonthTitle", { destination: city.name })}
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

      {data.directFares.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2">
            <Plane className="size-5 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight">{t("directFlightsTitle")}</h2>
          </div>
          <div className="mt-4 space-y-3">
            {data.directFares.slice(0, 6).map((offer) => (
              <FlightCard key={offer.id} offer={offer} locale={locale} />
            ))}
          </div>
        </section>
      )}

      <FlightsFaqSection title={tLanding("faqTitle")} items={faqItems} />
    </main>
  );
}
