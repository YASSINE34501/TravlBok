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

async function toExternalFlightOffer(
  fare: PricesForDatesFare,
  currency: string
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
  };
}

/**
 * Travelpayouts' Aviasales Flight Data API (`prices_for_dates`) — real
 * fares, but aggregated/cached historical data, not a live seat-search.
 * `isCachedPrice: true` on every offer drives the "recently found" notice
 * in the UI; this must never be presented as a confirmed live quote.
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
      const fares = await fetchPricesForDates({
        origin,
        destination,
        departDate: params.departDate,
        returnDate: params.returnDate,
        currency,
        limit: 20,
      });
      return Promise.all(fares.map((fare) => toExternalFlightOffer(fare, currency)));
    },
  };
}
