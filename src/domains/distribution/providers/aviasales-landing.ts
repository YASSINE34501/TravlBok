import "server-only";
import {
  fetchCityDirections,
  fetchLatestPrices,
  fetchPricesForDates,
} from "@/lib/travelpayouts/client";
import { resolveAirlineName } from "@/lib/travelpayouts/airlines";
import { resolveCity } from "@/lib/travelpayouts/cities";

/**
 * Real-data feeds for the /flights landing page (Popular Routes, Cheapest
 * This Week, Top Destinations, Featured Airlines, Best Prices by Month).
 * Every function here calls a real Travelpayouts endpoint and returns only
 * what it actually gave back — never a curated/invented fallback list. A
 * function returning `[]` means "hide this section", not "show placeholders".
 *
 * `origin` is TravlBok's home market anchor (Casablanca/CMN), matching the
 * rest of the site's Morocco-first seed data — not a per-user setting.
 */

const CURATED_DESTINATION_IMAGES: Record<string, string> = {
  bali: "/destinations/bali.webp",
  dubai: "/destinations/dubai.webp",
  paris: "/destinations/paris.webp",
};

export type PopularRoute = {
  destinationCode: string;
  destinationName: string;
  countryCode: string;
  priceAmount: number;
  priceCurrency: string;
  airlineName: string;
  isRoundTrip: boolean;
};

export async function getPopularRoutes(origin: string, limit = 8): Promise<PopularRoute[]> {
  const directions = await fetchCityDirections(origin);
  const sorted = [...directions].sort((a, b) => a.price - b.price);

  const routes: PopularRoute[] = [];
  for (const direction of sorted) {
    if (routes.length >= limit) break;
    const city = await resolveCity(direction.destination);
    if (!city) continue; // unresolvable code — skip rather than show a blank name
    routes.push({
      destinationCode: direction.destination,
      destinationName: city.name,
      countryCode: city.countryCode,
      priceAmount: direction.price,
      priceCurrency: "USD",
      airlineName: await resolveAirlineName(direction.airline),
      isRoundTrip: Boolean(direction.return_at),
    });
  }
  return routes;
}

export type CheapFareThisWeek = {
  destinationCode: string;
  destinationName: string;
  priceAmount: number;
  priceCurrency: string;
  foundAt: string;
  departDate: string;
  returnDate: string | null;
};

const RECENCY_WINDOW_DAYS = 7;

export async function getCheapestThisWeek(origin: string, limit = 8): Promise<CheapFareThisWeek[]> {
  const latest = await fetchLatestPrices(origin, "usd", 30);
  const cutoff = Date.now() - RECENCY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const recent = latest.filter((entry) => new Date(entry.found_at).getTime() >= cutoff);

  const fares: CheapFareThisWeek[] = [];
  for (const entry of recent) {
    if (fares.length >= limit) break;
    const city = await resolveCity(entry.destination);
    if (!city) continue;
    fares.push({
      destinationCode: entry.destination,
      destinationName: city.name,
      priceAmount: entry.value,
      priceCurrency: "USD",
      foundAt: entry.found_at,
      departDate: entry.depart_date,
      returnDate: entry.return_date ?? null,
    });
  }
  return fares;
}

export type TopDestination = {
  code: string;
  name: string;
  countryCode: string;
  fromPriceAmount: number;
  fromPriceCurrency: string;
  imageUrl: string | null;
};

export async function getTopDestinations(origin: string, limit = 6): Promise<TopDestination[]> {
  const directions = await fetchCityDirections(origin);
  const withImages: TopDestination[] = [];
  const withoutImages: TopDestination[] = [];

  for (const direction of directions) {
    const city = await resolveCity(direction.destination);
    if (!city) continue;
    const image = CURATED_DESTINATION_IMAGES[city.name.trim().toLowerCase()] ?? null;
    const dest: TopDestination = {
      code: direction.destination,
      name: city.name,
      countryCode: city.countryCode,
      fromPriceAmount: direction.price,
      fromPriceCurrency: "USD",
      imageUrl: image,
    };
    (image ? withImages : withoutImages).push(dest);
  }

  // Real destinations we happen to already have a real photo asset for are
  // shown first (better gallery presentation) — never a reason to invent a
  // stock image for the rest, they just render with an icon instead.
  return [...withImages, ...withoutImages].slice(0, limit);
}

export type FeaturedAirline = {
  code: string;
  name: string;
  routeCount: number;
};

export async function getFeaturedAirlines(origin: string, limit = 6): Promise<FeaturedAirline[]> {
  const directions = await fetchCityDirections(origin);
  const counts = new Map<string, number>();
  for (const direction of directions) {
    counts.set(direction.airline, (counts.get(direction.airline) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  return Promise.all(
    sorted.map(async ([code, routeCount]) => ({
      code,
      name: await resolveAirlineName(code),
      routeCount,
    }))
  );
}

export type MonthlyPrice = {
  month: string;
  minPriceAmount: number;
  priceCurrency: string;
};

export async function getBestPricesByMonth(
  origin: string,
  destination: string,
  monthsAhead = 6
): Promise<MonthlyPrice[]> {
  const now = new Date();
  const months: string[] = [];
  for (let i = 0; i < monthsAhead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const results = await Promise.all(
    months.map(async (month) => {
      const fares = await fetchPricesForDates({ origin, destination, departDate: month, currency: "usd", limit: 20 });
      if (fares.length === 0) return null;
      return { month, minPriceAmount: Math.min(...fares.map((f) => f.price)), priceCurrency: "USD" };
    })
  );
  return results.filter((r): r is MonthlyPrice => r !== null);
}
