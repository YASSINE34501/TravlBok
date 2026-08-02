import "server-only";
import { searchExternalOffers } from "../search";
import type { ExternalFlightOffer } from "../types";
import {
  fetchLatestPrices,
  fetchCityDirections,
  fetchPricesForDates,
  TravelpayoutsApiError,
} from "@/lib/travelpayouts/client";
import { resolveCity } from "@/lib/travelpayouts/cities";
import { toExternalFlightOffer } from "./aviasales-provider";
import { getBestPricesByMonth, getTopDestinations, type MonthlyPrice, type TopDestination } from "./aviasales-landing";

/**
 * Real-data feeds for the Flights SEO content pages (destinations, routes,
 * deals, airlines, cached offer details) — same contract as
 * `aviasales-landing.ts`: every function calls a real Travelpayouts endpoint
 * and returns only what it actually gave back, or `[]`/`null` to tell the
 * caller to hide that section/page rather than show placeholders. Nothing
 * here invents a price, route, schedule, or policy.
 *
 * `HOME_ORIGIN` is TravlBok's one real market anchor (Casablanca/CMN),
 * matching the rest of the site's Morocco-first seed data — every "real
 * fares" section on a destination/deals/airline page is inherently a
 * from-Casablanca view, because that's the only origin this integration has
 * real data for. Route pages are the one page type that supports an
 * arbitrary real origin (both cities come from the URL slug).
 */
const HOME_ORIGIN = "CMN";

export type FlightRoutePageData = {
  originCode: string;
  destinationCode: string;
  /** Every real fare found (exact match + tagged alternatives) — same objects `FlightCard` already renders. */
  fares: ExternalFlightOffer[];
  /** Subset of `fares` with no `alternativeType` — an exact match to this origin/destination pair. */
  exactFares: ExternalFlightOffer[];
  /** Subset of `fares` with zero stops. */
  directFares: ExternalFlightOffer[];
  monthlyPrices: MonthlyPrice[];
  /** Unique real airline display names appearing in `fares`. */
  airlines: string[];
  lowestPriceAmount: number | null;
  lowestPriceCurrency: string | null;
};

async function buildRoutePageData(originCode: string, destinationCode: string): Promise<FlightRoutePageData> {
  const [fares, monthlyPrices] = await Promise.all([
    searchExternalOffers("FLIGHT", { origin: originCode, destination: destinationCode }).catch(
      () => [] as ExternalFlightOffer[]
    ),
    getBestPricesByMonth(originCode, destinationCode).catch(() => [] as MonthlyPrice[]),
  ]);

  const exactFares = fares.filter((offer) => !offer.alternativeType);
  const directFares = fares.filter((offer) => offer.stops === 0);
  const airlines = Array.from(new Set(fares.map((offer) => offer.airlineName))).sort();
  const priceSource = exactFares.length > 0 ? exactFares : fares;
  const lowestPriceAmount =
    priceSource.length > 0 ? Math.min(...priceSource.map((offer) => offer.priceAmount)) : null;
  const lowestPriceCurrency = priceSource[0]?.priceCurrency ?? null;

  return {
    originCode,
    destinationCode,
    fares,
    exactFares,
    directFares,
    monthlyPrices,
    airlines,
    lowestPriceAmount,
    lowestPriceCurrency,
  };
}

export type FlightDestinationPageData = FlightRoutePageData & {
  homeOriginCode: string;
  homeCityName: string;
};

/** Destination pages are always anchored to `HOME_ORIGIN` — see module doc. */
export async function getDestinationPageData(destinationCode: string): Promise<FlightDestinationPageData> {
  const [data, homeCity] = await Promise.all([
    buildRoutePageData(HOME_ORIGIN, destinationCode),
    resolveCity(HOME_ORIGIN),
  ]);
  return { ...data, homeOriginCode: HOME_ORIGIN, homeCityName: homeCity?.name ?? HOME_ORIGIN };
}

/** Route pages support any real, resolvable origin/destination pair (both come from the URL slug). */
export async function getRoutePageData(originCode: string, destinationCode: string): Promise<FlightRoutePageData> {
  return buildRoutePageData(originCode, destinationCode);
}

/** The single place that decides "strong" (indexable) vs. "thin" (noindex) for a destination/route page — reused by `generateMetadata` and the sitemap builder so the rule can't drift between the two. */
export function hasSufficientFlightContent(data: Pick<FlightRoutePageData, "exactFares" | "monthlyPrices">): boolean {
  return data.exactFares.length > 0 || data.monthlyPrices.length > 0;
}

export type CachedDeal = {
  destinationCode: string;
  destinationName: string;
  priceAmount: number;
  priceCurrency: string;
  foundAt: string;
  departDate: string;
  returnDate: string | null;
  stops: number;
};

export type FlightDealsPageData = {
  homeOriginCode: string;
  homeCityName: string;
  cheapest: CachedDeal[];
  underThreshold: CachedDeal[];
  directOnly: CachedDeal[];
  oneWay: CachedDeal[];
  popularDestinations: TopDestination[];
  monthlyByDestination: Array<{ destinationCode: string; destinationName: string; monthlyPrices: MonthlyPrice[] }>;
};

const DEALS_LATEST_PRICES_LIMIT = 60;
const DEALS_SECTION_LIMIT = 12;
const DEALS_MONTHLY_DESTINATIONS = 3;

export async function getDealsPageData(thresholdUsd: number): Promise<FlightDealsPageData> {
  const [latest, popularDestinations, homeCity] = await Promise.all([
    fetchLatestPrices(HOME_ORIGIN, "usd", DEALS_LATEST_PRICES_LIMIT).catch(() => []),
    getTopDestinations(HOME_ORIGIN, 8).catch(() => [] as TopDestination[]),
    resolveCity(HOME_ORIGIN),
  ]);

  const deals: CachedDeal[] = [];
  for (const entry of latest) {
    const city = await resolveCity(entry.destination);
    if (!city) continue; // unresolvable code — skip rather than show a blank name
    deals.push({
      destinationCode: entry.destination,
      destinationName: city.name,
      priceAmount: entry.value,
      priceCurrency: "USD",
      foundAt: entry.found_at,
      departDate: entry.depart_date,
      returnDate: entry.return_date ?? null,
      stops: entry.number_of_changes,
    });
  }

  const cheapest = [...deals].sort((a, b) => a.priceAmount - b.priceAmount).slice(0, DEALS_SECTION_LIMIT);
  const underThreshold = deals
    .filter((deal) => deal.priceAmount <= thresholdUsd)
    .sort((a, b) => a.priceAmount - b.priceAmount)
    .slice(0, DEALS_SECTION_LIMIT);
  const directOnly = deals.filter((deal) => deal.stops === 0).slice(0, DEALS_SECTION_LIMIT);
  const oneWay = deals.filter((deal) => !deal.returnDate).slice(0, DEALS_SECTION_LIMIT);

  const monthlyByDestination = (
    await Promise.all(
      popularDestinations.slice(0, DEALS_MONTHLY_DESTINATIONS).map(async (destination) => ({
        destinationCode: destination.code,
        destinationName: destination.name,
        monthlyPrices: await getBestPricesByMonth(HOME_ORIGIN, destination.code).catch(() => [] as MonthlyPrice[]),
      }))
    )
  ).filter((entry) => entry.monthlyPrices.length > 0);

  return {
    homeOriginCode: HOME_ORIGIN,
    homeCityName: homeCity?.name ?? HOME_ORIGIN,
    cheapest,
    underThreshold,
    directOnly,
    oneWay,
    popularDestinations,
    monthlyByDestination,
  };
}

export type AirlineRoute = {
  destinationCode: string;
  destinationName: string;
  priceAmount: number;
  priceCurrency: string;
};

export type FlightAirlinePageData = {
  homeOriginCode: string;
  routes: AirlineRoute[];
  fares: ExternalFlightOffer[];
};

/** Bounds how many of an airline's real routes get a follow-up `prices_for_dates` call for its "recently found fares" section — `fetchLatestPrices` has no `airline` field to filter by directly, so this is the bounded, real alternative (never an unbounded scan). */
const MAX_AIRLINE_ROUTES_TO_QUERY = 10;

export async function getAirlinePageData(code: string): Promise<FlightAirlinePageData> {
  const directions = await fetchCityDirections(HOME_ORIGIN).catch(() => []);
  const ownDirections = directions.filter((direction) => direction.airline === code);

  const routes: AirlineRoute[] = [];
  for (const direction of ownDirections) {
    const city = await resolveCity(direction.destination);
    if (!city) continue;
    routes.push({
      destinationCode: direction.destination,
      destinationName: city.name,
      priceAmount: direction.price,
      priceCurrency: "USD",
    });
  }

  const boundedRoutes = routes.slice(0, MAX_AIRLINE_ROUTES_TO_QUERY);
  const fareLists = await Promise.all(
    boundedRoutes.map((route) =>
      fetchPricesForDates({
        origin: HOME_ORIGIN,
        destination: route.destinationCode,
        currency: "usd",
        limit: 10,
      }).catch(() => [])
    )
  );
  const matchingFares = fareLists.flat().filter((fare) => fare.airline === code);
  const offers = await Promise.all(matchingFares.map((fare) => toExternalFlightOffer(fare, "usd", null)));
  offers.sort((a, b) => a.priceAmount - b.priceAmount);

  return { homeOriginCode: HOME_ORIGIN, routes, fares: offers.slice(0, 12) };
}

const OFFER_ID_PATTERN = /^aviasales-([A-Z]{3})-([A-Z]{3})-(\d+)-(\d{4}-\d{2}-\d{2}.*)$/;

export function parseOfferId(
  offerId: string
): { originCode: string; destinationCode: string; flightNumber: string; departureAt: string } | null {
  // The route's `[offerId]` param can arrive still percent-encoded (observed
  // live: Next's dynamic segment handling doesn't always decode `%3A`/`%2B`
  // before this runs) — the id's departure timestamp contains `:` and,
  // for offers with a timezone offset, `+`, so decoding defensively here is
  // what makes matching against the API's own (always-decoded) `departure_at`
  // field actually work. Falls back to the raw string on a malformed
  // sequence rather than throwing.
  let decoded: string;
  try {
    decoded = decodeURIComponent(offerId);
  } catch {
    decoded = offerId;
  }
  const match = OFFER_ID_PATTERN.exec(decoded);
  if (!match) return null;
  const [, originCode, destinationCode, flightNumber, departureAt] = match;
  return { originCode, destinationCode, flightNumber, departureAt };
}

/**
 * Re-derives a single cached fare from a `FlightCard`-style offer id. There
 * is no persistent offer store — every offer is computed live from
 * `prices_for_dates` — so this parses the id's embedded origin/destination/
 * flight-number/departure-time and re-queries that exact month, matching on
 * flight number + departure timestamp. Returns `null` both for a malformed
 * id and for a real fare that has simply rotated out of Travelpayouts'
 * cache since it was last shown — callers must treat both the same way: an
 * honest "no longer available" state, never a fabricated fallback.
 */
export async function getOfferById(offerId: string): Promise<ExternalFlightOffer | null> {
  const parsed = parseOfferId(offerId);
  if (!parsed) return null;

  const month = parsed.departureAt.slice(0, 7);
  let fares;
  try {
    fares = await fetchPricesForDates({
      origin: parsed.originCode,
      destination: parsed.destinationCode,
      departDate: month,
      currency: "usd",
      limit: 50,
    });
  } catch (error) {
    if (error instanceof TravelpayoutsApiError) return null;
    throw error;
  }

  const match = fares.find(
    (fare) => fare.departure_at === parsed.departureAt && String(fare.flight_number) === parsed.flightNumber
  );
  if (!match) return null;
  return toExternalFlightOffer(match, "usd", null);
}
