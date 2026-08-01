import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PlaneTakeoff, TriangleAlert, Info } from "lucide-react";
import { searchExternalOffers } from "@/domains/distribution/search";
import { isDistributionConfigured } from "@/domains/distribution/providers/registry";
import { FlightCard } from "@/components/flights/flight-card";
import { FlightFilters } from "@/components/flights/flight-filters";
import { FlightsLanding } from "@/components/flights/flights-landing";
import { SearchSort } from "@/components/search/search-sort";
import { SearchSummaryBar } from "@/components/search/search-summary-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buildLocaleAlternates } from "@/lib/seo/alternates";
import { getDisplayCurrencyContext } from "@/lib/currency/display";
import type { ExternalFlightOffer } from "@/domains/distribution/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("flightsTitle"),
    description: t("flightsDescription"),
    alternates: buildLocaleAlternates(locale, "/flights"),
  };
}

type FlightSort = "best" | "price_asc" | "duration_asc";

export default async function FlightsSearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const t = await getTranslations("Flights");
  const tSearch = await getTranslations("Search");

  // No search submitted yet — show the real-data landing page instead of a
  // results page that would otherwise render an empty/"no results" state
  // before the user has actually searched for anything.
  if (!query.origin || !query.destination) {
    const { currency, rates } = await getDisplayCurrencyContext();
    return <FlightsLanding locale={locale} currency={currency} rates={rates} />;
  }

  const configured = isDistributionConfigured("FLIGHT");

  // Distinguishes "not connected" (no provider configured at all) from
  // "configured, but the live call to Travelpayouts failed just now" — the
  // two need different empty states, and a fetch failure here must never
  // crash the page or fall back to fabricated results.
  let offers: ExternalFlightOffer[] = [];
  let apiError = false;
  if (configured) {
    try {
      offers = await searchExternalOffers("FLIGHT", {
        origin: query.origin,
        destination: query.destination,
        departDate: query.departDate,
        returnDate: query.returnDate,
        passengers: query.passengers ? Number(query.passengers) : undefined,
      });
    } catch {
      apiError = true;
    }
  }

  let filtered = offers;
  if (query.nonStop === "1") {
    filtered = filtered.filter((o) => o.stops === 0);
  }
  if (query.minPrice) {
    filtered = filtered.filter((o) => o.priceAmount >= Number(query.minPrice));
  }
  if (query.maxPrice) {
    filtered = filtered.filter((o) => o.priceAmount <= Number(query.maxPrice));
  }
  if (query.airlines) {
    const airlines = query.airlines.split(",").filter(Boolean);
    filtered = filtered.filter((o) => airlines.includes(o.airlineName));
  }

  const sort = (query.sort as FlightSort) ?? "best";
  if (sort === "price_asc") {
    filtered = [...filtered].sort((a, b) => a.priceAmount - b.priceAmount);
  } else if (sort === "duration_asc") {
    filtered = [...filtered].sort((a, b) => a.durationMinutes - b.durationMinutes);
  }

  const airlineOptions = Array.from(new Set(offers.map((o) => o.airlineName))).sort();
  const hasCachedPrices = filtered.some((o) => o.isCachedPrice);
  // The provider only ever returns alternatives (alternativeType set) once
  // the exact search itself came back sparse/empty — if every remaining
  // result here is an alternative, none of them matched the search exactly.
  const hasExactMatches = filtered.some((o) => !o.alternativeType);
  const showAlternativesNotice = filtered.length > 0 && !hasExactMatches;

  const summaryItems: Array<{ label: string; value: string }> = [];
  if (query.origin && query.destination) {
    summaryItems.push({
      label: `${tSearch("origin")} ⇄ ${tSearch("destination")}`,
      value: `${query.origin} ⇄ ${query.destination}`,
    });
  }
  if (query.departDate) {
    summaryItems.push({
      label: query.returnDate
        ? `${tSearch("departDate")} / ${tSearch("returnDateOptional")}`
        : tSearch("departDate"),
      value: query.returnDate ? `${query.departDate} → ${query.returnDate}` : query.departDate,
    });
  }
  if (query.passengers) summaryItems.push({ label: tSearch("passengers"), value: query.passengers });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      {summaryItems.length > 0 && (
        <SearchSummaryBar items={summaryItems} modifyLabel={tSearch("modifySearch")} />
      )}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {tSearch("resultsCount", { count: filtered.length })}
        </h1>
        {configured && !apiError && (
          <SearchSort
            basePath="/flights"
            options={[
              { value: "best", label: t("sortBest") },
              { value: "price_asc", label: t("sortCheapest") },
              { value: "duration_asc", label: t("sortFastest") },
            ]}
          />
        )}
      </div>

      {!configured ? (
        <EmptyState
          icon={PlaneTakeoff}
          title={t("notConnectedTitle")}
          description={t("notConnectedDescription")}
          className="mt-8"
        />
      ) : apiError ? (
        <EmptyState
          icon={TriangleAlert}
          title={t("unavailableTitle")}
          description={t("unavailableDescription")}
          className="mt-8"
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border bg-card p-5 shadow-sm md:h-fit">
            <FlightFilters airlines={airlineOptions} />
          </aside>

          <div className="space-y-4">
            {showAlternativesNotice && (
              <Alert className="border-warning/30 bg-warning/10 *:[svg]:text-warning">
                <TriangleAlert />
                <AlertDescription className="text-foreground">{t("alternativesNotice")}</AlertDescription>
              </Alert>
            )}
            {hasCachedPrices && (
              <Alert>
                <Info />
                <AlertDescription>{t("staleNotice")}</AlertDescription>
              </Alert>
            )}
            {filtered.length === 0 ? (
              <EmptyState icon={PlaneTakeoff} title={t("noFlightsMatch")} />
            ) : (
              filtered.map((offer) => <FlightCard key={offer.id} offer={offer} locale={locale} />)
            )}
          </div>
        </div>
      )}
    </main>
  );
}
