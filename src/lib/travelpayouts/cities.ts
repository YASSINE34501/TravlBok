import "server-only";
import { slugify } from "@/lib/flights/slugs";

export type FlightableCity = {
  code: string;
  name: string;
  countryCode: string;
};

type CityEntry = {
  code: string;
  name: string | null;
  country_code: string;
  has_flightable_airport: boolean;
};

let cache: FlightableCity[] | null = null;
let cachePromise: Promise<FlightableCity[]> | null = null;

/**
 * Travelpayouts' own public reference dataset, filtered to
 * `has_flightable_airport: true` only — this is the exact flag the API
 * itself uses to decide whether a code is searchable (confirmed live: a
 * real IATA code like "CAS", Casablanca's metro-area code, isn't in this
 * flightable set and the search API rejects it with "airport CAS: not
 * flightable"; the actual searchable code is "CMN"). Resolving user input
 * against this list before calling prices_for_dates is what prevents that
 * class of failure — real reference data, not a fabricated allowlist.
 */
async function loadFlightableCities(): Promise<FlightableCity[]> {
  if (cache) return cache;
  if (!cachePromise) {
    cachePromise = fetch("https://api.travelpayouts.com/data/en/cities.json", {
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: 86_400 },
    })
      .then((res) => (res.ok ? (res.json() as Promise<CityEntry[]>) : []))
      .then((entries) => {
        const cities = entries
          .filter((entry): entry is CityEntry & { name: string } =>
            Boolean(entry.has_flightable_airport && entry.name)
          )
          .map((entry) => ({ code: entry.code, name: entry.name, countryCode: entry.country_code }));
        cache = cities;
        return cities;
      })
      .catch(() => [] as FlightableCity[]);
  }
  return cachePromise;
}

/** Case-insensitive "starts with" matches first, then "contains" matches, capped at `limit`. */
export async function searchFlightableCities(query: string, limit = 8): Promise<FlightableCity[]> {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  const cities = await loadFlightableCities();
  const startsWith: FlightableCity[] = [];
  const contains: FlightableCity[] = [];
  for (const city of cities) {
    const name = city.name.toLowerCase();
    if (name.startsWith(trimmed)) startsWith.push(city);
    else if (name.includes(trimmed)) contains.push(city);
    if (startsWith.length >= limit) break;
  }
  return [...startsWith, ...contains].slice(0, limit);
}

/** True only for a code Travelpayouts itself considers searchable — the same guard the API enforces. */
export async function isFlightableCode(code: string): Promise<boolean> {
  const cities = await loadFlightableCities();
  return cities.some((city) => city.code === code.toUpperCase());
}

/** Real name + country for a city code (e.g. resolving a route's destination code for display) — `null` if unknown. */
export async function resolveCity(code: string): Promise<FlightableCity | null> {
  const cities = await loadFlightableCities();
  return cities.find((city) => city.code === code.toUpperCase()) ?? null;
}

/**
 * Slug match against the same real flightable-cities dataset (e.g.
 * `"paris"` → the real Paris/PAR entry) — used to turn a
 * `/flights/destinations/[destination]` or route-slug segment into a real
 * IATA code. `null` for anything that doesn't match a real city name, which
 * callers must treat as `notFound()` rather than rendering a blank page.
 */
export async function resolveCityBySlug(slug: string): Promise<FlightableCity | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const cities = await loadFlightableCities();
  return cities.find((city) => slugify(city.name) === normalized) ?? null;
}
