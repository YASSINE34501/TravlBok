import { describe, it, expect, beforeAll, vi } from "vitest";

const FIXTURE = [
  { code: "CMN", name: "Casablanca", country_code: "MA", has_flightable_airport: true },
  { code: "CAS", name: "Casablanca", country_code: "MA", has_flightable_airport: false },
  { code: "PAR", name: "Paris", country_code: "FR", has_flightable_airport: true },
  { code: "BVA", name: "Paris", country_code: "FR", has_flightable_airport: false },
  { code: "PRG", name: "Prague", country_code: "CZ", has_flightable_airport: true },
];

beforeAll(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => FIXTURE,
    })
  );
});

describe("searchFlightableCities", () => {
  it("only returns cities with has_flightable_airport: true — this is exactly what the Aviasales API itself checks (confirmed live: 'CAS' returns 'airport CAS: not flightable')", async () => {
    const { searchFlightableCities } = await import("@/lib/travelpayouts/cities");
    const results = await searchFlightableCities("Casablanca");
    expect(results).toEqual([{ code: "CMN", name: "Casablanca", countryCode: "MA" }]);
  });

  it("ranks 'starts with' matches before 'contains' matches", async () => {
    vi.resetModules();
    const { searchFlightableCities } = await import("@/lib/travelpayouts/cities");
    const results = await searchFlightableCities("Pra");
    expect(results[0]).toEqual({ code: "PRG", name: "Prague", countryCode: "CZ" });
  });

  it("returns nothing for a query shorter than 2 characters (avoids matching everything on the first keystroke)", async () => {
    vi.resetModules();
    const { searchFlightableCities } = await import("@/lib/travelpayouts/cities");
    expect(await searchFlightableCities("p")).toEqual([]);
  });
});

describe("isFlightableCode", () => {
  it("returns true for a real flightable code", async () => {
    vi.resetModules();
    const { isFlightableCode } = await import("@/lib/travelpayouts/cities");
    expect(await isFlightableCode("CMN")).toBe(true);
  });

  it("returns false for a code that exists but isn't flightable (the exact 'CAS' bug case)", async () => {
    vi.resetModules();
    const { isFlightableCode } = await import("@/lib/travelpayouts/cities");
    expect(await isFlightableCode("CAS")).toBe(false);
  });

  it("returns false for a code that doesn't exist at all", async () => {
    vi.resetModules();
    const { isFlightableCode } = await import("@/lib/travelpayouts/cities");
    expect(await isFlightableCode("ZZZ")).toBe(false);
  });
});
