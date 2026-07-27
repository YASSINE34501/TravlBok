import type { DistributionProviderCode } from "@/generated/prisma/client";
import type {
  HotelOfferSearchParams,
  CarOfferSearchParams,
  FlightOfferSearchParams,
  ExternalHotelOffer,
  ExternalCarOffer,
  ExternalFlightOffer,
} from "../types";

/**
 * A provider only implements the verticals it actually offers — a
 * hotel-only aggregator wouldn't define `searchFlights`, for example.
 * Mirrors `src/domains/channel-manager/providers/types.ts`'s adapter shape.
 */
export interface ExternalOfferProvider {
  code: DistributionProviderCode;
  displayName: string;
  /** True once a real partner contract + official API exist — always false today. */
  isLive: boolean;

  searchHotels?(params: HotelOfferSearchParams): Promise<ExternalHotelOffer[]>;
  searchCars?(params: CarOfferSearchParams): Promise<ExternalCarOffer[]>;
  searchFlights?(params: FlightOfferSearchParams): Promise<ExternalFlightOffer[]>;
}
