import "server-only";
import { getTravelpayoutsConfig } from "@/lib/env";

const API_BASE = "https://api.travelpayouts.com";

export class TravelpayoutsApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "TravelpayoutsApiError";
  }
}

export type PricesForDatesParams = {
  origin: string;
  destination: string;
  departDate?: string;
  returnDate?: string;
  currency?: string;
  limit?: number;
};

export type PricesForDatesFare = {
  origin: string;
  origin_airport: string;
  destination: string;
  destination_airport: string;
  airline: string;
  flight_number: string;
  price: number;
  departure_at: string;
  return_at?: string;
  transfers: number;
  return_transfers: number;
  duration: number;
  duration_to: number;
  duration_back: number;
  link: string;
  gate: string;
};

type PricesForDatesResponse = {
  success: boolean;
  data: PricesForDatesFare[];
  currency: string;
};

/**
 * Server-only Travelpayouts API client. `TRAVELPAYOUTS_API_TOKEN` is read
 * only here (never in a "use client" file, never prefixed NEXT_PUBLIC_) and
 * sent via the `X-Access-Token` header — it never reaches the browser.
 *
 * Wraps the Aviasales v3 "prices_for_dates" endpoint. This is cached/
 * aggregated fare data, not a live seat-availability search — callers must
 * present it as a "recently found" price, never as a confirmed live quote
 * (see the stale-price notice in the Flights results page).
 */
export async function fetchPricesForDates(
  params: PricesForDatesParams
): Promise<PricesForDatesFare[]> {
  const { apiToken } = getTravelpayoutsConfig();

  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    currency: params.currency ?? "usd",
    limit: String(params.limit ?? 10),
    sorting: "price",
    one_way: params.returnDate ? "false" : "true",
  });
  if (params.departDate) query.set("departure_at", params.departDate);
  if (params.returnDate) query.set("return_at", params.returnDate);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/aviasales/v3/prices_for_dates?${query.toString()}`, {
      headers: { "X-Access-Token": apiToken },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 3600 },
    });
  } catch {
    throw new TravelpayoutsApiError("Failed to reach the Travelpayouts API");
  }

  if (!response.ok) {
    throw new TravelpayoutsApiError(
      `Travelpayouts API responded with status ${response.status}`,
      response.status
    );
  }

  const body = (await response.json()) as PricesForDatesResponse;
  if (!body.success) {
    throw new TravelpayoutsApiError("Travelpayouts API reported an unsuccessful response");
  }
  return body.data;
}

export type CityDirection = {
  origin: string;
  destination: string;
  airline: string;
  departure_at: string;
  return_at?: string;
  price: number;
  flight_number: number;
  transfers: number;
};

type CityDirectionsResponse = {
  success?: boolean;
  data: Record<string, CityDirection>;
};

/**
 * Wraps Travelpayouts' `v1/city-directions` — the cheapest real fare found
 * per destination from a given origin. Powers "Popular Routes" and "Top
 * Destinations": real destinations Travelpayouts actually has fares for,
 * never a curated/invented list.
 */
export async function fetchCityDirections(origin: string, currency = "usd"): Promise<CityDirection[]> {
  const { apiToken } = getTravelpayoutsConfig();
  const query = new URLSearchParams({ origin, currency });

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/v1/city-directions?${query.toString()}`, {
      headers: { "X-Access-Token": apiToken },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 3600 },
    });
  } catch {
    throw new TravelpayoutsApiError("Failed to reach the Travelpayouts API");
  }
  if (!response.ok) {
    throw new TravelpayoutsApiError(
      `Travelpayouts API responded with status ${response.status}`,
      response.status
    );
  }
  const body = (await response.json()) as CityDirectionsResponse;
  return Object.values(body.data ?? {});
}

export type LatestPriceEntry = {
  origin: string;
  destination: string;
  value: number;
  depart_date: string;
  return_date?: string;
  found_at: string;
  gate: string;
  number_of_changes: number;
  duration: number;
};

type LatestPricesResponse = {
  currency: string;
  error: string;
  data: LatestPriceEntry[];
};

/**
 * Wraps Travelpayouts' `v2/prices/latest` — real recently-found cheap
 * fares, each with its own real `found_at` timestamp. Powers "Cheapest
 * Flights This Week" — callers should still filter to genuinely recent
 * `found_at` values rather than trusting the label alone.
 */
export async function fetchLatestPrices(
  origin: string,
  currency = "usd",
  limit = 30
): Promise<LatestPriceEntry[]> {
  const { apiToken } = getTravelpayoutsConfig();
  const query = new URLSearchParams({
    origin,
    currency,
    limit: String(limit),
    sorting: "price",
  });

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/v2/prices/latest?${query.toString()}`, {
      headers: { "X-Access-Token": apiToken },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 3600 },
    });
  } catch {
    throw new TravelpayoutsApiError("Failed to reach the Travelpayouts API");
  }
  if (!response.ok) {
    throw new TravelpayoutsApiError(
      `Travelpayouts API responded with status ${response.status}`,
      response.status
    );
  }
  const body = (await response.json()) as LatestPricesResponse;
  if (body.error) {
    throw new TravelpayoutsApiError(`Travelpayouts API reported an error: ${body.error}`);
  }
  return body.data ?? [];
}

/** Prepends the Aviasales domain and appends this account's marker to a fare's relative `link`. */
export function buildAviasalesDeepLink(relativeLink: string): string {
  const { partnerId } = getTravelpayoutsConfig();
  const separator = relativeLink.includes("?") ? "&" : "?";
  return `https://www.aviasales.com${relativeLink}${separator}marker=${partnerId}`;
}
