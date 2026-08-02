import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { locales } from "@/i18n/routing";
import { getAppUrl } from "@/lib/env";
import { isDistributionConfigured } from "@/domains/distribution/providers/registry";
import {
  getTopDestinations,
  getPopularRoutes,
  getFeaturedAirlines,
} from "@/domains/distribution/providers/aviasales-landing";
import { resolveCity } from "@/lib/travelpayouts/cities";
import { slugify, buildRouteSlug } from "@/lib/flights/slugs";

/** TravlBok's one real Flights market anchor — matches the landing page and every Flights content page. */
const FLIGHTS_HOME_ORIGIN = "CMN";
/**
 * Bounded, real seed counts for the Flights sitemap blocks below — the same
 * functions (and the same real "Travelpayouts actually returned a price for
 * this pair" guarantee) each page's own `generateStaticParams` already uses.
 * Deliberately reused as-is rather than re-running each page's full
 * `hasSufficientFlightContent` check per entry: that would mean up to
 * several additional live API calls per destination/route just to build the
 * sitemap (40+ destinations × multiple calls each), which is exactly the
 * "unbounded API generation during build" this cap exists to avoid. A
 * destination/route/airline appearing in these lists already means
 * Travelpayouts returned a real price for it — a cheap, honest, if
 * slightly coarser proxy for the same "strong" signal.
 */
const FLIGHTS_SITEMAP_DESTINATIONS_LIMIT = 40;
const FLIGHTS_SITEMAP_ROUTES_LIMIT = 30;
const FLIGHTS_SITEMAP_AIRLINES_LIMIT = 20;

/**
 * Single sitemap.xml covering every locale of every public marketing route,
 * plus dynamic hotel/vehicle detail pages and published CMS pages. Capped
 * at 500 of each dynamic entity (ordered by most recently published) to
 * keep this a single file — if the real catalog grows past that, split
 * into a sitemap index (`sitemap.xml/[id]`) instead of raising the cap.
 *
 * Deliberately excludes: admin, partner dashboard, auth, account, booking
 * confirmation, and any query-string/filtered variant of a listing page —
 * those are either private or duplicate-content risks, not new pages.
 */
export const revalidate = 3600; // 1 hour — matches how often listings realistically change

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "daily", priority: 1.0 },
  { path: "/hotels", changeFrequency: "daily", priority: 0.8 },
  { path: "/cars", changeFrequency: "daily", priority: 0.8 },
  { path: "/flights", changeFrequency: "daily", priority: 0.7 },
  { path: "/deals", changeFrequency: "daily", priority: 0.8 },
  { path: "/destinations", changeFrequency: "weekly", priority: 0.7 },
  { path: "/packages", changeFrequency: "weekly", priority: 0.6 },
  { path: "/become-a-partner", changeFrequency: "monthly", priority: 0.5 },
  { path: "/affiliate", changeFrequency: "monthly", priority: 0.4 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.3 },
];

function withLocales(
  path: string,
  appUrl: string,
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, `${appUrl}/${locale}${path}`])
  );
  return locales.map((locale) => ({
    url: `${appUrl}/${locale}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getAppUrl();
  const now = new Date();

  const staticEntries = STATIC_ROUTES.flatMap((route) =>
    withLocales(route.path, appUrl, now, route.changeFrequency, route.priority)
  );

  const [hotels, vehicles, cmsPages] = await Promise.all([
    prisma.hotel.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { id: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 500,
    }),
    prisma.vehicle.findMany({
      where: { approvalStatus: "PUBLISHED", deletedAt: null },
      select: { id: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 500,
    }),
    prisma.cmsPage.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      take: 200,
    }),
  ]);

  const hotelEntries = hotels.flatMap((hotel) =>
    withLocales(`/hotels/${hotel.id}`, appUrl, hotel.updatedAt, "weekly", 0.6)
  );
  const vehicleEntries = vehicles.flatMap((vehicle) =>
    withLocales(`/cars/${vehicle.id}`, appUrl, vehicle.updatedAt, "weekly", 0.5)
  );
  const cmsEntries = cmsPages.flatMap((page) =>
    withLocales(`/${page.slug}`, appUrl, page.updatedAt, "monthly", 0.4)
  );

  const flightEntries = isDistributionConfigured("FLIGHT")
    ? await buildFlightSitemapEntries(appUrl, now)
    : [];

  return [...staticEntries, ...hotelEntries, ...vehicleEntries, ...cmsEntries, ...flightEntries];
}

async function buildFlightSitemapEntries(appUrl: string, now: Date): Promise<MetadataRoute.Sitemap> {
  const [destinations, popularRoutes, airlines, homeCity] = await Promise.all([
    getTopDestinations(FLIGHTS_HOME_ORIGIN, FLIGHTS_SITEMAP_DESTINATIONS_LIMIT).catch(() => []),
    getPopularRoutes(FLIGHTS_HOME_ORIGIN, FLIGHTS_SITEMAP_ROUTES_LIMIT).catch(() => []),
    getFeaturedAirlines(FLIGHTS_HOME_ORIGIN, FLIGHTS_SITEMAP_AIRLINES_LIMIT).catch(() => []),
    resolveCity(FLIGHTS_HOME_ORIGIN),
  ]);

  const dealsEntries = withLocales("/flights/deals", appUrl, now, "daily", 0.7);

  const destinationEntries = destinations.flatMap((destination) =>
    withLocales(`/flights/destinations/${slugify(destination.name)}`, appUrl, now, "daily", 0.6)
  );

  const routeEntries = homeCity
    ? popularRoutes.flatMap((route) =>
        withLocales(
          `/flights/routes/${buildRouteSlug(homeCity.name, route.destinationName)}`,
          appUrl,
          now,
          "daily",
          0.6
        )
      )
    : [];

  const airlineEntries = airlines.flatMap((airline) =>
    withLocales(`/flights/airlines/${slugify(airline.name)}`, appUrl, now, "weekly", 0.5)
  );

  return [...dealsEntries, ...destinationEntries, ...routeEntries, ...airlineEntries];
}
