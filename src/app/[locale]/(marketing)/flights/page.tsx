import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PlaneTakeoff } from "lucide-react";
import { searchExternalOffers } from "@/domains/distribution/search";
import { isDistributionConfigured } from "@/domains/distribution/providers/registry";
import { FlightCard } from "@/components/flights/flight-card";
import { FlightFilters } from "@/components/flights/flight-filters";
import { SearchSort } from "@/components/search/search-sort";
import { SearchSummaryBar } from "@/components/search/search-summary-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { buildLocaleAlternates } from "@/lib/seo/alternates";

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

  const configured = isDistributionConfigured("FLIGHT");

  const offers = configured
    ? await searchExternalOffers("FLIGHT", {
        origin: query.origin,
        destination: query.destination,
        departDate: query.departDate,
        returnDate: query.returnDate,
        passengers: query.passengers ? Number(query.passengers) : undefined,
      })
    : [];

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
        {configured && (
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
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border bg-card p-5 shadow-sm md:h-fit">
            <FlightFilters airlines={airlineOptions} />
          </aside>

          <div className="space-y-4">
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
