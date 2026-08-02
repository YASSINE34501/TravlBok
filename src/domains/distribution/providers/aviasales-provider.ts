import "server-only";
import type { ExternalOfferProvider } from "./types";
import type { FlightOfferSearchParams, ExternalFlightOffer } from "../types";
import {
  fetchPricesForDates,
  buildAviasalesDeepLink,
  type PricesForDatesFare,
} from "@/lib/travelpayouts/client";
import { resolveAirlineName } from "@/lib/travelpayouts/airlines";
import { isFlightableCode } from "@/lib/travelpayouts/cities";

const IATA_CODE_PATTERN = /^[A-Z]{3}$/;

/** Below this many exact matches, it's worth also showing real fallback offers. */
const MIN_EXACT_RESULTS = 3;
/** A fare within this many days of the requested departure date counts as "nearby" rather than just "somewhere in the month". */
const NEARBY_DAYS_WINDOW = 3;

/** Exported for reuse by aviasales-content.ts (SEO content pages re-derive an offer from a fresh `PricesForDatesFare` the same way the live search provider does — one transform, not two). */
export async function toExternalFlightOffer(
  fare: PricesForDatesFare,
  currency: string,
  alternativeType: ExternalFlightOffer["alternativeType"]
): Promise<ExternalFlightOffer> {
  const id = `aviasales-${fare.origin_airport}-${fare.destination_airport}-${fare.flight_number}-${fare.departure_at}`;
  return {
    id,
    vertical: "FLIGHT",
    sourceType: "AFFILIATE_REDIRECT",
    provider: "AVIASALES",
    priceAmount: fare.price,
    priceCurrency: currency.toUpperCase() as ExternalFlightOffer["priceCurrency"],
    redirectUrl: buildAviasalesDeepLink(fare.link),
    airlineName: await resolveAirlineName(fare.airline),
    flightNumber: fare.flight_number,
    originCode: fare.origin_airport,
    destinationCode: fare.destination_airport,
    departAt: fare.departure_at,
    returnAt: fare.return_at ?? null,
    durationMinutes: fare.duration,
    stops: fare.transfers,
    isCachedPrice: true,
    alternativeType,
  };
}

/**
 * Travelpayouts' Aviasales Flight Data API (`prices_for_dates`) — real
 * fares, but aggregated/cached historical data, not a live seat-search.
 * `isCachedPrice: true` on every offer drives the "recently found" notice
 * in the UI; this must never be presented as a confirmed live quote.
 *
 * When the exact search comes back sparse, this also queries real
 * Travelpayouts data more broadly (same month, nearby dates, one-way) and
 * returns those too — each one tagged with `alternativeType` so the UI can
 * keep them visibly separate from actual exact matches. Never fabricated:
 * every fallback tier is its own real API call.
 */
export function createAviasalesProvider(): ExternalOfferProvider {
  return {
    code: "AVIASALES",
    displayName: "Aviasales (Travelpayouts)",
    isLive: true,

    async searchFlights(params: FlightOfferSearchParams): Promise<ExternalFlightOffer[]> {
      if (!params.origin || !params.destination) return [];

      // The origin/destination combobox only ever submits a code the user
      // picked from Travelpayouts' own flightable-city list, so this is
      // normally a no-op. It only matters for a hand-crafted URL (or any
      // other future caller) — rejecting an invalid/non-flightable code
      // here means a plain "no results" empty state instead of the search
      // API's 400 (which would otherwise surface as a misleading "temporarily
      // unavailable" error for what's really just bad input, not an outage).
      const origin = params.origin.toUpperCase().trim();
      const destination = params.destination.toUpperCase().trim();
      if (!IATA_CODE_PATTERN.test(origin) || !IATA_CODE_PATTERN.test(destination)) return [];
      const [originFlightable, destinationFlightable] = await Promise.all([
        isFlightableCode(origin),
        isFlightableCode(destination),
      ]);
      if (!originFlightable || !destinationFlightable) return [];

      const currency = "usd";
      const exactFares = await fetchPricesForDates({
        origin,
        destination,
        departDate: params.departDate,
        returnDate: params.returnDate,
        currency,
        limit: 20,
      });
      const exactOffers = await Promise.all(
        exactFares.map((fare) => toExternalFlightOffer(fare, currency, null))
      );

      if (exactOffers.length >= MIN_EXACT_RESULTS || !params.departDate) {
        return exactOffers;
      }

      const seenIds = new Set(exactOffers.map((offer) => offer.id));
      const alternatives: ExternalFlightOffer[] = [];

      // Tier 1: exact requested departure date, but one-way — only tells
      // us something new when the original search wanted a round trip.
      if (params.returnDate) {
        const oneWayExactFares = await fetchPricesForDates({
          origin,
          destination,
          departDate: params.departDate,
          currency,
          limit: 20,
        });
        for (const fare of oneWayExactFares) {
          const offer = await toExternalFlightOffer(fare, currency, "ONE_WAY");
          if (!seenIds.has(offer.id)) {
            seenIds.add(offer.id);
            alternatives.push(offer);
          }
        }
      }

      // Tier 2 & 3: the whole departure month, one-way. Fetched once and
      // split by proximity to the requested date — this is real data
      // either way, so one API call covers both "nearby dates" and
      // "monthly cached offers" instead of issuing several near-date calls.
      const month = params.departDate.slice(0, 7);
      const targetTime = new Date(params.departDate).getTime();
      const monthFares = await fetchPricesForDates({
        origin,
        destination,
        departDate: month,
        currency,
        limit: 20,
      });
      for (const fare of monthFares) {
        const dayDiff = Math.abs((new Date(fare.departure_at).getTime() - targetTime) / 86_400_000);
        const type = dayDiff <= NEARBY_DAYS_WINDOW ? "NEARBY_DATES" : "MONTHLY";
        const offer = await toExternalFlightOffer(fare, currency, type);
        if (!seenIds.has(offer.id)) {
          seenIds.add(offer.id);
          alternatives.push(offer);
        }
      }

      return [...exactOffers, ...alternatives];
    },
  };
}
