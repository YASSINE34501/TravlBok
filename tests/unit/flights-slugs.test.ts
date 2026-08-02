import { describe, it, expect, beforeAll, vi } from "vitest";
import { slugify, parseRouteSlug, buildRouteSlug } from "@/lib/flights/slugs";

const CITY_FIXTURE = [
  { code: "CMN", name: "Casablanca", country_code: "MA", has_flightable_airport: true },
  { code: "PAR", name: "Paris", country_code: "FR", has_flightable_airport: true },
  { code: "GRU", name: "São Paulo", country_code: "BR", has_flightable_airport: true },
];

const AIRLINE_FIXTURE = [
  { code: "AT", name: "Royal Air Maroc" },
  { code: "TO", name: "Transavia France" },
];

describe("slugify", () => {
  it("lowercases and hyphenates a plain name", () => {
    expect(slugify("Casablanca")).toBe("casablanca");
  });

  it("strips diacritics", () => {
    expect(slugify("São Paulo")).toBe("sao-paulo");
  });

  it("collapses non-alphanumeric runs into single hyphens and trims edges", () => {
    expect(slugify("  Royal Air Maroc!! ")).toBe("royal-air-maroc");
  });
});

describe("parseRouteSlug", () => {
  it("splits a valid route slug on the '-to-' separator", () => {
    expect(parseRouteSlug("casablanca-to-paris")).toEqual({
      originSlug: "casablanca",
      destinationSlug: "paris",
    });
  });

  it("returns null when the separator is missing", () => {
    expect(parseRouteSlug("casablanca-paris")).toBeNull();
  });

  it("returns null when the separator appears more than once (ambiguous)", () => {
    expect(parseRouteSlug("a-to-b-to-c")).toBeNull();
  });

  it("returns null when either half is empty", () => {
    expect(parseRouteSlug("-to-paris")).toBeNull();
    expect(parseRouteSlug("casablanca-to-")).toBeNull();
  });
});

describe("buildRouteSlug", () => {
  it("builds the inverse of parseRouteSlug from two real city names", () => {
    expect(buildRouteSlug("Casablanca", "São Paulo")).toBe("casablanca-to-sao-paulo");
  });
});

describe("resolveDestinationSlug / resolveRouteSlug / resolveAirlineSlug", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("cities.json")) {
          return Promise.resolve({ ok: true, json: async () => CITY_FIXTURE });
        }
        if (url.includes("airlines.json")) {
          return Promise.resolve({ ok: true, json: async () => AIRLINE_FIXTURE });
        }
        return Promise.resolve({ ok: false, json: async () => [] });
      })
    );
  });

  it("resolves a real destination slug to its real city", async () => {
    vi.resetModules();
    const { resolveDestinationSlug } = await import("@/lib/flights/slugs");
    expect(await resolveDestinationSlug("paris")).toEqual({ code: "PAR", name: "Paris", countryCode: "FR" });
  });

  it("returns null for a destination slug that doesn't match any real city", async () => {
    vi.resetModules();
    const { resolveDestinationSlug } = await import("@/lib/flights/slugs");
    expect(await resolveDestinationSlug("nonexistent-city")).toBeNull();
  });

  it("resolves a real route slug to both real cities", async () => {
    vi.resetModules();
    const { resolveRouteSlug } = await import("@/lib/flights/slugs");
    expect(await resolveRouteSlug("casablanca-to-paris")).toEqual({
      origin: { code: "CMN", name: "Casablanca", countryCode: "MA" },
      destination: { code: "PAR", name: "Paris", countryCode: "FR" },
    });
  });

  it("returns null for a route slug where one city doesn't resolve", async () => {
    vi.resetModules();
    const { resolveRouteSlug } = await import("@/lib/flights/slugs");
    expect(await resolveRouteSlug("casablanca-to-atlantis")).toBeNull();
  });

  it("returns null for a malformed route slug", async () => {
    vi.resetModules();
    const { resolveRouteSlug } = await import("@/lib/flights/slugs");
    expect(await resolveRouteSlug("casablanca-paris")).toBeNull();
  });

  it("resolves a real airline slug to its real IATA code", async () => {
    vi.resetModules();
    const { resolveAirlineSlug } = await import("@/lib/flights/slugs");
    expect(await resolveAirlineSlug("royal-air-maroc")).toEqual({ code: "AT", name: "Royal Air Maroc" });
  });

  it("returns null for an airline slug not in the real dataset", async () => {
    vi.resetModules();
    const { resolveAirlineSlug } = await import("@/lib/flights/slugs");
    expect(await resolveAirlineSlug("fake-airline")).toBeNull();
  });
});
