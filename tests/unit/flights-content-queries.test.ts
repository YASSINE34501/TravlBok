import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const CITY_FIXTURE = [
  { code: "CMN", name: "Casablanca", country_code: "MA", has_flightable_airport: true },
  { code: "CDG", name: "Paris", country_code: "FR", has_flightable_airport: true },
];

const AIRLINE_FIXTURE = [{ code: "AT", name: "Royal Air Maroc" }];

const POPULATED_FARE = {
  origin: "CMN",
  origin_airport: "CMN",
  destination: "CDG",
  destination_airport: "CDG",
  airline: "AT",
  flight_number: "123",
  price: 250,
  departure_at: "2026-09-14T08:00:00",
  transfers: 0,
  return_transfers: 0,
  duration: 240,
  duration_to: 240,
  duration_back: 0,
  link: "/search/CMN0608CDG1",
  gate: "aviasales",
};

function stubFetch(options: {
  pricesForDates?: unknown[];
  pricesForDatesOk?: boolean;
  cityDirections?: Record<string, unknown>;
  latestPrices?: unknown[];
}) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("cities.json")) {
        return Promise.resolve({ ok: true, json: async () => CITY_FIXTURE });
      }
      if (url.includes("airlines.json")) {
        return Promise.resolve({ ok: true, json: async () => AIRLINE_FIXTURE });
      }
      if (url.includes("prices_for_dates")) {
        if (options.pricesForDatesOk === false) {
          return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, currency: "usd", data: options.pricesForDates ?? [] }),
        });
      }
      if (url.includes("city-directions")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: options.cityDirections ?? {} }) });
      }
      if (url.includes("prices/latest")) {
        return Promise.resolve({ ok: true, json: async () => ({ currency: "usd", error: "", data: options.latestPrices ?? [] }) });
      }
      return Promise.resolve({ ok: false, json: async () => ({}) });
    })
  );
}

describe("aviasales-content real-data query functions", () => {
  const originalToken = process.env.TRAVELPAYOUTS_API_TOKEN;
  const originalPartner = process.env.TRAVELPAYOUTS_PARTNER_ID;

  beforeEach(() => {
    process.env.TRAVELPAYOUTS_API_TOKEN = "test-token";
    process.env.TRAVELPAYOUTS_PARTNER_ID = "12345";
    vi.resetModules();
  });

  afterEach(() => {
    process.env.TRAVELPAYOUTS_API_TOKEN = originalToken;
    process.env.TRAVELPAYOUTS_PARTNER_ID = originalPartner;
    vi.unstubAllGlobals();
  });

  it("getDestinationPageData returns real fares and derived airlines when the API has data", async () => {
    stubFetch({ pricesForDates: [POPULATED_FARE] });
    const { getDestinationPageData } = await import("@/domains/distribution/providers/aviasales-content");
    const data = await getDestinationPageData("CDG");
    expect(data.exactFares.length).toBeGreaterThan(0);
    expect(data.airlines).toEqual(["Royal Air Maroc"]);
    expect(data.lowestPriceAmount).toBe(250);
    expect(data.homeCityName).toBe("Casablanca");
  });

  it("getDestinationPageData hides every section (returns empty arrays, never fabricates) when the API genuinely has no data", async () => {
    stubFetch({ pricesForDates: [] });
    const { getDestinationPageData } = await import("@/domains/distribution/providers/aviasales-content");
    const data = await getDestinationPageData("CDG");
    expect(data.fares).toEqual([]);
    expect(data.exactFares).toEqual([]);
    expect(data.monthlyPrices).toEqual([]);
    expect(data.lowestPriceAmount).toBeNull();
  });

  it("getDestinationPageData degrades gracefully (never throws) when the live API call fails", async () => {
    stubFetch({ pricesForDatesOk: false });
    const { getDestinationPageData } = await import("@/domains/distribution/providers/aviasales-content");
    const data = await getDestinationPageData("CDG");
    expect(data.fares).toEqual([]);
    expect(data.monthlyPrices).toEqual([]);
  });

  it("hasSufficientFlightContent is false for a destination with no real data — must never be indexed", async () => {
    stubFetch({ pricesForDates: [] });
    const { getDestinationPageData, hasSufficientFlightContent } = await import(
      "@/domains/distribution/providers/aviasales-content"
    );
    const data = await getDestinationPageData("CDG");
    expect(hasSufficientFlightContent(data)).toBe(false);
  });

  it("getDealsPageData buckets real latest-price entries by stops/one-way/threshold without inventing new ones", async () => {
    stubFetch({
      latestPrices: [
        { origin: "CMN", destination: "CDG", value: 150, depart_date: "2026-09-14", found_at: new Date().toISOString(), gate: "aviasales", number_of_changes: 0, duration: 240 },
        { origin: "CMN", destination: "CDG", value: 500, depart_date: "2026-10-01", return_date: "2026-10-08", found_at: new Date().toISOString(), gate: "aviasales", number_of_changes: 1, duration: 300 },
      ],
      cityDirections: { CDG: { origin: "CMN", destination: "CDG", airline: "AT", departure_at: "2026-09-14", price: 150, flight_number: 123, transfers: 0 } },
    });
    const { getDealsPageData } = await import("@/domains/distribution/providers/aviasales-content");
    const data = await getDealsPageData(200);
    expect(data.cheapest.length).toBe(2);
    expect(data.underThreshold).toEqual([expect.objectContaining({ priceAmount: 150 })]);
    expect(data.directOnly).toEqual([expect.objectContaining({ priceAmount: 150 })]);
    expect(data.oneWay).toEqual([expect.objectContaining({ priceAmount: 150 })]);
  });

  it("getDealsPageData returns empty buckets (never fabricated deals) when the API has no recent prices", async () => {
    stubFetch({ latestPrices: [] });
    const { getDealsPageData } = await import("@/domains/distribution/providers/aviasales-content");
    const data = await getDealsPageData(200);
    expect(data.cheapest).toEqual([]);
    expect(data.underThreshold).toEqual([]);
    expect(data.directOnly).toEqual([]);
    expect(data.oneWay).toEqual([]);
  });

  it("getAirlinePageData derives real routes from city-directions filtered to the requested airline code", async () => {
    stubFetch({
      cityDirections: {
        CDG: { origin: "CMN", destination: "CDG", airline: "AT", departure_at: "2026-09-14", price: 150, flight_number: 123, transfers: 0 },
      },
      pricesForDates: [POPULATED_FARE],
    });
    const { getAirlinePageData } = await import("@/domains/distribution/providers/aviasales-content");
    const data = await getAirlinePageData("AT");
    expect(data.routes).toEqual([{ destinationCode: "CDG", destinationName: "Paris", priceAmount: 150, priceCurrency: "USD" }]);
  });

  it("getAirlinePageData returns no routes for an airline with zero real directions", async () => {
    stubFetch({ cityDirections: {} });
    const { getAirlinePageData } = await import("@/domains/distribution/providers/aviasales-content");
    const data = await getAirlinePageData("ZZ");
    expect(data.routes).toEqual([]);
    expect(data.fares).toEqual([]);
  });

  it("getOfferById re-derives a real fare from its id and finds the matching cached fare", async () => {
    stubFetch({ pricesForDates: [POPULATED_FARE] });
    const { getOfferById } = await import("@/domains/distribution/providers/aviasales-content");
    const offer = await getOfferById("aviasales-CMN-CDG-123-2026-09-14T08:00:00");
    expect(offer).not.toBeNull();
    expect(offer?.priceAmount).toBe(250);
    expect(offer?.airlineName).toBe("Royal Air Maroc");
  });

  it("getOfferById returns null (honest 'no longer available', never a fabricated fallback) when the fare has rotated out of cache", async () => {
    stubFetch({ pricesForDates: [] });
    const { getOfferById } = await import("@/domains/distribution/providers/aviasales-content");
    const offer = await getOfferById("aviasales-CMN-CDG-123-2026-09-14T08:00:00");
    expect(offer).toBeNull();
  });

  it("getOfferById returns null immediately for a malformed id, without calling the API", async () => {
    stubFetch({ pricesForDates: [POPULATED_FARE] });
    const { getOfferById } = await import("@/domains/distribution/providers/aviasales-content");
    const offer = await getOfferById("not-a-real-id");
    expect(offer).toBeNull();
  });

  it("getOfferById returns null (not a crash) when the live re-query fails", async () => {
    stubFetch({ pricesForDatesOk: false });
    const { getOfferById } = await import("@/domains/distribution/providers/aviasales-content");
    const offer = await getOfferById("aviasales-CMN-CDG-123-2026-09-14T08:00:00");
    expect(offer).toBeNull();
  });
});
