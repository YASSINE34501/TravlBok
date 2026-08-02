import "server-only";
import { resolveCityBySlug, type FlightableCity } from "@/lib/travelpayouts/cities";
import { resolveAirlineBySlug } from "@/lib/travelpayouts/airlines";

const DIACRITICS_PATTERN = /[̀-ͯ]/g;

/** Lowercases, strips diacritics, and collapses anything non-alphanumeric into single hyphens (e.g. `"São Paulo"` → `"sao-paulo"`). Pure string logic — no server-only dependency — safe to reuse from any resolver keyed by a real name. */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(DIACRITICS_PATTERN, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ROUTE_SEPARATOR = "-to-";

/** Splits a `/flights/routes/[route]` segment (e.g. `"casablanca-to-paris"`) into its two raw slug halves — `null` if the literal `-to-` separator isn't present at all, or is present more than once (ambiguous). */
export function parseRouteSlug(routeParam: string): { originSlug: string; destinationSlug: string } | null {
  const parts = routeParam.split(ROUTE_SEPARATOR);
  if (parts.length !== 2) return null;
  const [originSlug, destinationSlug] = parts;
  if (!originSlug || !destinationSlug) return null;
  return { originSlug, destinationSlug };
}

/** Builds the `origin-to-destination` route slug from two real city names — the inverse of `parseRouteSlug`, used when linking to a route page from elsewhere (e.g. an internal-links block). */
export function buildRouteSlug(originName: string, destinationName: string): string {
  return `${slugify(originName)}${ROUTE_SEPARATOR}${slugify(destinationName)}`;
}

/** Resolves a `/flights/destinations/[destination]` segment to a real, flightable city — `null` for anything that doesn't match a real city name, which the caller must treat as `notFound()`. */
export async function resolveDestinationSlug(slug: string): Promise<FlightableCity | null> {
  return resolveCityBySlug(slug);
}

/** Resolves a `/flights/routes/[route]` segment to two real, flightable cities — `null` if the slug isn't `origin-to-destination` shaped, or either half doesn't match a real city name. */
export async function resolveRouteSlug(
  routeParam: string
): Promise<{ origin: FlightableCity; destination: FlightableCity } | null> {
  const parsed = parseRouteSlug(routeParam);
  if (!parsed) return null;
  const [origin, destination] = await Promise.all([
    resolveCityBySlug(parsed.originSlug),
    resolveCityBySlug(parsed.destinationSlug),
  ]);
  if (!origin || !destination) return null;
  return { origin, destination };
}

/** Resolves a `/flights/airlines/[airline]` segment to a real airline — `null` for anything not in Travelpayouts' own airline dataset. */
export async function resolveAirlineSlug(slug: string): Promise<{ code: string; name: string } | null> {
  return resolveAirlineBySlug(slug);
}
