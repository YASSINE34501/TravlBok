import type { ExternalOfferProvider } from "./types";
import type {
  HotelOfferSearchParams,
  CarOfferSearchParams,
  FlightOfferSearchParams,
  ExternalHotelOffer,
  ExternalCarOffer,
  ExternalFlightOffer,
} from "../types";

/**
 * Dev/test-only illustrative data — never active in production (see
 * registry.ts's env-flag gate). Unlike Channel Manager's always-on mock
 * (fine for partner-facing back-office tooling, clearly labeled "Sandbox"
 * to the partner in their own dashboard), this powers public customer-
 * facing search, so it must never render without the explicit opt-in flag.
 * Results are deterministic (seeded from the search params) so the same
 * search returns the same offers across a refresh/navigation.
 */
function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const HOTEL_NAMES = ["Riad Zahra", "Atlas View Hotel", "Ocean Breeze Suites", "Medina Palace"];
const CAR_BRANDS: Array<[string, string]> = [
  ["Toyota", "Corolla"],
  ["Hyundai", "Tucson"],
  ["Dacia", "Duster"],
  ["Renault", "Clio"],
];
const AIRLINES = ["Atlas Air", "Sahara Wings", "Medina Airways", "Casablanca Jet"];

function buildRedirectUrl(vertical: string, offerId: string, seed: string): string {
  const trackingId = seededRandom(`${seed}-click`)().toString(36).slice(2, 10);
  return `https://sandbox.example-travel-partner.test/${vertical}/${offerId}?ref=travlbok&clickref=${trackingId}`;
}

export function createMockProvider(): ExternalOfferProvider {
  return {
    code: "MOCK_SANDBOX",
    displayName: "Sandbox (testing)",
    isLive: false,

    async searchHotels(params: HotelOfferSearchParams): Promise<ExternalHotelOffer[]> {
      const seed = `hotel-${params.destination ?? ""}-${params.checkIn ?? ""}-${params.checkOut ?? ""}`;
      const rand = seededRandom(seed);
      return HOTEL_NAMES.map((name, i) => {
        const id = `mock-hotel-${seed}-${i}`;
        return {
          id,
          vertical: "HOTEL",
          sourceType: "AFFILIATE_REDIRECT",
          provider: "MOCK_SANDBOX",
          priceAmount: Math.round(400 + rand() * 1600),
          priceCurrency: "MAD",
          redirectUrl: buildRedirectUrl("hotels", id, seed + i),
          name,
          cityName: params.destination || "Marrakech",
          countryName: "Morocco",
          imageUrl: null,
          starRating: 3 + Math.floor(rand() * 3),
          avgRating: Math.round((3.5 + rand() * 1.5) * 10) / 10,
        };
      });
    },

    async searchCars(params: CarOfferSearchParams): Promise<ExternalCarOffer[]> {
      const seed = `car-${params.location ?? ""}-${params.pickupDate ?? ""}-${params.returnDate ?? ""}`;
      const rand = seededRandom(seed);
      return CAR_BRANDS.map(([brand, model], i) => {
        const id = `mock-car-${seed}-${i}`;
        return {
          id,
          vertical: "CAR",
          sourceType: "AFFILIATE_REDIRECT",
          provider: "MOCK_SANDBOX",
          priceAmount: Math.round(150 + rand() * 450),
          priceCurrency: "MAD",
          redirectUrl: buildRedirectUrl("cars", id, seed + i),
          brand,
          model,
          category: i % 2 === 0 ? "Economy" : "SUV",
          imageUrl: null,
          transmission: i % 3 === 0 ? "MANUAL" : "AUTOMATIC",
        };
      });
    },

    async searchFlights(params: FlightOfferSearchParams): Promise<ExternalFlightOffer[]> {
      const seed = `flight-${params.origin ?? ""}-${params.destination ?? ""}-${params.departDate ?? ""}`;
      const rand = seededRandom(seed);
      const baseDate = params.departDate ? new Date(params.departDate) : new Date();
      return AIRLINES.map((airlineName, i) => {
        const id = `mock-flight-${seed}-${i}`;
        const departHour = 6 + Math.floor(rand() * 14);
        const durationMinutes = 90 + Math.floor(rand() * 300);
        const departAt = new Date(baseDate);
        departAt.setHours(departHour, Math.floor(rand() * 60), 0, 0);
        return {
          id,
          vertical: "FLIGHT",
          sourceType: "AFFILIATE_REDIRECT",
          provider: "MOCK_SANDBOX",
          priceAmount: Math.round(600 + rand() * 3400),
          priceCurrency: "MAD",
          redirectUrl: buildRedirectUrl("flights", id, seed + i),
          airlineName,
          flightNumber: String(1000 + Math.floor(rand() * 8999)),
          originCode: (params.origin || "CMN").slice(0, 3).toUpperCase(),
          destinationCode: (params.destination || "CDG").slice(0, 3).toUpperCase(),
          departAt: departAt.toISOString(),
          returnAt: params.returnDate ? new Date(params.returnDate).toISOString() : null,
          durationMinutes,
          stops: i % 3 === 0 ? 1 : 0,
          isCachedPrice: false,
        };
      });
    },
  };
}
