import type {
  DistributionVertical,
  DistributionProviderCode,
  SourceType,
  CurrencyCode,
} from "@/generated/prisma/client";

export type HotelOfferSearchParams = {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
};

export type CarOfferSearchParams = {
  location?: string;
  dropoffLocation?: string;
  pickupDate?: string;
  returnDate?: string;
};

export type FlightOfferSearchParams = {
  origin?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  passengers?: number;
};

type ExternalOfferBase = {
  id: string;
  sourceType: SourceType;
  provider: DistributionProviderCode;
  priceAmount: number;
  priceCurrency: CurrencyCode;
  /** Provider's own tracked deep link — already carries that provider's affiliate/click params. */
  redirectUrl: string;
};

export type ExternalHotelOffer = ExternalOfferBase & {
  vertical: "HOTEL";
  name: string;
  cityName: string;
  countryName: string;
  imageUrl: string | null;
  starRating: number | null;
  avgRating: number | null;
};

export type ExternalCarOffer = ExternalOfferBase & {
  vertical: "CAR";
  brand: string;
  model: string;
  category: string;
  imageUrl: string | null;
  transmission: "MANUAL" | "AUTOMATIC";
};

export type ExternalFlightOffer = ExternalOfferBase & {
  vertical: "FLIGHT";
  airlineName: string;
  flightNumber: string;
  originCode: string;
  destinationCode: string;
  departAt: string;
  /** Present only for round-trip searches. */
  returnAt: string | null;
  durationMinutes: number;
  stops: number;
  /**
   * True for providers whose price is aggregated/cached fare data rather
   * than a live seat-availability quote (e.g. Aviasales' prices_for_dates).
   * Drives the "recently found" notice — never omit it for such offers.
   */
  isCachedPrice: boolean;
};

export type ExternalOffer = ExternalHotelOffer | ExternalCarOffer | ExternalFlightOffer;

export type { DistributionVertical, DistributionProviderCode, SourceType };
