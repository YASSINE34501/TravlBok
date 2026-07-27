import "server-only";
import { getConfiguredProviders } from "./providers/registry";
import type {
  ExternalHotelOffer,
  ExternalCarOffer,
  ExternalFlightOffer,
  HotelOfferSearchParams,
  CarOfferSearchParams,
  FlightOfferSearchParams,
} from "./types";

/**
 * Merges every configured provider's results for a vertical. Returns `[]`
 * whenever no provider is configured (today's real production state for
 * every vertical) — callers must render an honest empty/not-connected
 * state in that case, never fabricate results. Overloaded (rather than a
 * generic conditional-type parameter) so each vertical's params/return
 * shape is pinned exactly — TS can't reliably infer a params type from a
 * conditional type keyed off a sibling parameter's inferred literal.
 */
export async function searchExternalOffers(
  vertical: "HOTEL",
  params: HotelOfferSearchParams
): Promise<ExternalHotelOffer[]>;
export async function searchExternalOffers(
  vertical: "CAR",
  params: CarOfferSearchParams
): Promise<ExternalCarOffer[]>;
export async function searchExternalOffers(
  vertical: "FLIGHT",
  params: FlightOfferSearchParams
): Promise<ExternalFlightOffer[]>;
export async function searchExternalOffers(
  vertical: "HOTEL" | "CAR" | "FLIGHT",
  params: HotelOfferSearchParams | CarOfferSearchParams | FlightOfferSearchParams
): Promise<ExternalHotelOffer[] | ExternalCarOffer[] | ExternalFlightOffer[]> {
  const providers = getConfiguredProviders(vertical);
  if (providers.length === 0) return [];

  if (vertical === "HOTEL") {
    const results = await Promise.all(
      providers.map((p) => p.searchHotels?.(params as HotelOfferSearchParams) ?? [])
    );
    return results.flat();
  }
  if (vertical === "CAR") {
    const results = await Promise.all(
      providers.map((p) => p.searchCars?.(params as CarOfferSearchParams) ?? [])
    );
    return results.flat();
  }
  const results = await Promise.all(
    providers.map((p) => p.searchFlights?.(params as FlightOfferSearchParams) ?? [])
  );
  return results.flat();
}
