import { describe, it, expect } from "vitest";
import { getCheckoutMode, buildGoHref } from "@/domains/distribution/checkout-mode";
import type { ExternalFlightOffer } from "@/domains/distribution/types";

/**
 * Every new Flights content page (destination/route/deals/airline/offer
 * detail) renders its "View Deal" CTA through this exact same
 * `getCheckoutMode` + `buildGoHref` pair the existing `FlightCard` already
 * uses — no parallel affiliate-tracking system. This test locks down that
 * every real Aviasales offer (`AFFILIATE_REDIRECT`) always produces an
 * `EXTERNAL_REDIRECT` checkout mode and a `/[locale]/go/flight?...` href
 * carrying a real offerId/sourceType — never a bypassed direct link to the
 * provider, and never something that could route into the internal
 * booking flow.
 */
describe("Flights content pages' View Deal links stay on the tracked redirect path", () => {
  const sampleOffer: ExternalFlightOffer = {
    id: "aviasales-CMN-CDG-123-2026-09-14T08:00:00",
    vertical: "FLIGHT",
    sourceType: "AFFILIATE_REDIRECT",
    provider: "AVIASALES",
    priceAmount: 250,
    priceCurrency: "USD",
    redirectUrl: "https://www.aviasales.com/search/CMN0608CDG1?marker=12345",
    airlineName: "Royal Air Maroc",
    flightNumber: "123",
    originCode: "CMN",
    destinationCode: "CDG",
    departAt: "2026-09-14T08:00:00",
    returnAt: null,
    durationMinutes: 240,
    stops: 0,
    isCachedPrice: true,
  };

  it("every real Aviasales offer resolves to EXTERNAL_REDIRECT, never INTERNAL_CHECKOUT", () => {
    expect(getCheckoutMode(sampleOffer.sourceType)).toBe("EXTERNAL_REDIRECT");
  });

  it("buildGoHref always produces a /[locale]/go/flight URL carrying the real offerId, provider, and sourceType", () => {
    const href = buildGoHref({
      locale: "en",
      vertical: "flight",
      provider: sampleOffer.provider,
      offerId: sampleOffer.id,
      url: sampleOffer.redirectUrl,
      sourceType: sampleOffer.sourceType,
    });

    expect(href).toMatch(/^\/en\/go\/flight\?/);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("offerId")).toBe(sampleOffer.id);
    expect(params.get("provider")).toBe("AVIASALES");
    expect(params.get("sourceType")).toBe("AFFILIATE_REDIRECT");
    expect(params.get("url")).toBe(sampleOffer.redirectUrl);
  });

  it("never resolves a real flight offer to EXTERNAL_WIDGET or INTERNAL_CHECKOUT — those code paths are for other sourceTypes only", () => {
    expect(getCheckoutMode("AFFILIATE_REDIRECT")).not.toBe("INTERNAL_CHECKOUT");
    expect(getCheckoutMode("AFFILIATE_REDIRECT")).not.toBe("EXTERNAL_WIDGET");
  });
});
