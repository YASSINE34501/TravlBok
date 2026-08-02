import { describe, it, expect } from "vitest";
import {
  hasSufficientFlightContent,
  parseOfferId,
} from "@/domains/distribution/providers/aviasales-content";
import type { ExternalFlightOffer } from "@/domains/distribution/types";

const FAKE_OFFER = {} as ExternalFlightOffer;

describe("hasSufficientFlightContent — the single strong/thin gate shared by page metadata and the sitemap", () => {
  it("is strong when at least one exact fare exists", () => {
    expect(hasSufficientFlightContent({ exactFares: [FAKE_OFFER], monthlyPrices: [] })).toBe(true);
  });

  it("is strong when monthly prices exist even with zero exact fares", () => {
    expect(
      hasSufficientFlightContent({
        exactFares: [],
        monthlyPrices: [{ month: "2026-09", minPriceAmount: 120, priceCurrency: "USD" }],
      })
    ).toBe(true);
  });

  it("is thin when both are empty — must never be indexed or sitemapped", () => {
    expect(hasSufficientFlightContent({ exactFares: [], monthlyPrices: [] })).toBe(false);
  });
});

describe("parseOfferId — re-deriving a cached fare from its FlightCard id", () => {
  it("parses a well-formed id into its four real fields", () => {
    expect(parseOfferId("aviasales-CMN-CDG-1234-2026-09-14T08:00:00")).toEqual({
      originCode: "CMN",
      destinationCode: "CDG",
      flightNumber: "1234",
      departureAt: "2026-09-14T08:00:00",
    });
  });

  it("correctly separates the flight number from a departure timestamp carrying a timezone offset (which itself contains a hyphen)", () => {
    const parsed = parseOfferId("aviasales-CMN-CDG-1234-2026-09-14T08:00:00-05:00");
    expect(parsed).toEqual({
      originCode: "CMN",
      destinationCode: "CDG",
      flightNumber: "1234",
      departureAt: "2026-09-14T08:00:00-05:00",
    });
  });

  it("returns null for a malformed id — never partially parsed", () => {
    expect(parseOfferId("not-a-real-offer-id")).toBeNull();
  });

  it("returns null when the airport codes aren't 3 uppercase letters", () => {
    expect(parseOfferId("aviasales-cmn-cdg-1234-2026-09-14T08:00:00")).toBeNull();
  });

  it("decodes a still-percent-encoded id (observed live: Next's [offerId] param can arrive with %3A/%2B undecoded) — regression test for a real bug where every offer detail page falsely showed 'no longer available'", () => {
    const encoded = "aviasales-CMN-ORY-3069-2026-12-05T19%3A15%3A00%2B01%3A00";
    expect(parseOfferId(encoded)).toEqual({
      originCode: "CMN",
      destinationCode: "ORY",
      flightNumber: "3069",
      departureAt: "2026-12-05T19:15:00+01:00",
    });
  });

  it("still parses an already-decoded id the same way (decoding twice would be wrong, but this id has no literal '%' so it's a safe no-op)", () => {
    expect(parseOfferId("aviasales-CMN-ORY-3069-2026-12-05T19:15:00+01:00")).toEqual({
      originCode: "CMN",
      destinationCode: "ORY",
      flightNumber: "3069",
      departureAt: "2026-12-05T19:15:00+01:00",
    });
  });
});
