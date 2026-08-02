import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildFlightsPageMetadata } from "@/lib/seo/flights-metadata";

describe("buildFlightsPageMetadata", () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://travlbok.com";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it("builds a canonical URL and hreflang alternates for every app locale", () => {
    const metadata = buildFlightsPageMetadata({
      locale: "en",
      path: "/flights/destinations/paris",
      title: "Flights to Paris",
      description: "Recently found fares to Paris.",
      index: true,
    });

    expect(metadata.alternates?.canonical).toBe("https://travlbok.com/en/flights/destinations/paris");
    expect(metadata.alternates?.languages).toEqual({
      en: "https://travlbok.com/en/flights/destinations/paris",
      fr: "https://travlbok.com/fr/flights/destinations/paris",
      ar: "https://travlbok.com/ar/flights/destinations/paris",
    });
  });

  it("marks a strong page indexable", () => {
    const metadata = buildFlightsPageMetadata({
      locale: "en",
      path: "/flights/destinations/paris",
      title: "t",
      description: "d",
      index: true,
    });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("marks a thin page noindex,follow — never fully deindexed (still crawlable for internal links)", () => {
    const metadata = buildFlightsPageMetadata({
      locale: "en",
      path: "/flights/destinations/nowhere",
      title: "t",
      description: "d",
      index: false,
    });
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it("substitutes the real title/description passed in — never a generic unsubstituted template", () => {
    const metadata = buildFlightsPageMetadata({
      locale: "fr",
      path: "/flights/airlines/royal-air-maroc",
      title: "Vols Royal Air Maroc",
      description: "Tarifs pour Royal Air Maroc.",
      index: true,
    });
    expect(metadata.title).toBe("Vols Royal Air Maroc");
    expect(metadata.description).toBe("Tarifs pour Royal Air Maroc.");
  });
});
