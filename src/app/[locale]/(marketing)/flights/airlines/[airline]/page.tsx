import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { MapPin, PlaneTakeoff } from "lucide-react";
import { resolveAirlineSlug, slugify } from "@/lib/flights/slugs";
import { getFeaturedAirlines } from "@/domains/distribution/providers/aviasales-landing";
import { getAirlinePageData } from "@/domains/distribution/providers/aviasales-content";
import { FlightSearchForm } from "@/components/flights/flight-search-form";
import { FlightCard } from "@/components/flights/flight-card";
import { FareCard } from "@/components/flights/fare-card";
import { AirlineLogo } from "@/components/flights/airline-logo";
import { AirlineChipList } from "@/components/flights/airline-chip-list";
import { CachedPriceNotice } from "@/components/flights/cached-price-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import { buildFlightsPageMetadata } from "@/lib/seo/flights-metadata";
import { getDisplayCurrencyContext, formatFromBase } from "@/lib/currency/display";

const HOME_ORIGIN = "CMN";
const STATIC_AIRLINES_LIMIT = 20;

/** Bounded, real seed set — any other real airline slug still renders on demand. */
export async function generateStaticParams() {
  const airlines = await getFeaturedAirlines(HOME_ORIGIN, STATIC_AIRLINES_LIMIT).catch(() => []);
  return airlines.map((airline) => ({ airline: slugify(airline.name) }));
}

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; airline: string }>;
}): Promise<Metadata> {
  const { locale, airline: airlineSlug } = await params;
  const airline = await resolveAirlineSlug(airlineSlug);
  if (!airline) return {};

  const t = await getTranslations({ locale, namespace: "FlightsContent" });
  const data = await getAirlinePageData(airline.code);

  return buildFlightsPageMetadata({
    locale,
    path: `/flights/airlines/${airlineSlug}`,
    title: t("airlineMetaTitle", { airline: airline.name }),
    description: t("airlineMetaDescription", { airline: airline.name, code: airline.code }),
    index: data.routes.length > 0,
  });
}

export default async function FlightAirlinePage({
  params,
}: {
  params: Promise<{ locale: string; airline: string }>;
}) {
  const { locale, airline: airlineSlug } = await params;
  setRequestLocale(locale);

  const airline = await resolveAirlineSlug(airlineSlug);
  if (!airline) notFound();

  const [t, tNav, tLanding, data, allAirlines, { currency, rates }] = await Promise.all([
    getTranslations({ locale, namespace: "FlightsContent" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "FlightsLanding" }),
    getAirlinePageData(airline.code),
    getFeaturedAirlines(HOME_ORIGIN, 8).catch(() => []),
    getDisplayCurrencyContext(),
  ]);

  const price = (amount: number) => formatFromBase(amount, "USD", currency, rates, locale);

  const breadcrumbItems = [
    { label: tNav("flights"), href: "/flights" },
    { label: airline.name },
  ];

  const relatedAirlines = allAirlines.filter((a) => a.code !== airline.code).slice(0, 6);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <JsonLd data={buildBreadcrumbJsonLd(locale, breadcrumbItems)} />
      <BreadcrumbNav items={breadcrumbItems} />

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <AirlineLogo code={airline.code} name={airline.name} size={64} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("airlinePageTitle", { airline: airline.name })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{airline.code}</p>
        </div>
      </div>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        {t("airlinePageIntro", { airline: airline.name })}
      </p>

      <div className="mt-6">
        <FlightSearchForm />
      </div>

      <div className="mt-8">
        <CachedPriceNotice locale={locale} />
      </div>

      {data.routes.length === 0 ? (
        <EmptyState
          icon={PlaneTakeoff}
          title={t("airlineNoDataTitle", { airline: airline.name })}
          className="mt-8"
        />
      ) : (
        <>
          {data.fares.length > 0 && (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold tracking-tight">{t("recentlyFoundFaresTitle")}</h2>
              <div className="mt-4 space-y-3">
                {data.fares.map((offer) => (
                  <FlightCard key={offer.id} offer={offer} locale={locale} />
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              <h2 className="text-2xl font-semibold tracking-tight">{t("airlineRoutesTitle")}</h2>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.routes.map((route) => (
                <FareCard
                  key={route.destinationCode}
                  href={`/flights/destinations/${slugify(route.destinationName)}`}
                  originCode={HOME_ORIGIN}
                  destinationCode={route.destinationCode}
                  title={route.destinationName}
                  priceLabel={price(route.priceAmount)}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {relatedAirlines.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">{tLanding("featuredAirlinesTitle")}</h2>
          <div className="mt-4">
            <AirlineChipList airlineNames={relatedAirlines.map((related) => related.name)} />
          </div>
        </section>
      )}
    </main>
  );
}
