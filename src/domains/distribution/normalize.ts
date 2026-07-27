import { buildGoHref } from "@/domains/distribution/checkout-mode";
import type {
  ExternalHotelOffer,
  ExternalCarOffer,
  ExternalFlightOffer,
} from "@/domains/distribution/types";

/** Canonical shape `HotelCard` renders, whether the row is direct inventory or an external offer. */
export type HotelCardData = {
  id: string;
  name: string;
  mainImageUrl: string | null;
  starRating: number | null;
  city: { name: unknown } | null;
  fromPrice: unknown;
  fromPriceCurrency: ExternalHotelOffer["priceCurrency"];
  avgRating?: number | null;
  /** Absent (→ DIRECT_TRAVLBOK) for TravlBok's own inventory. Never rendered as UI copy. */
  sourceType?: ExternalHotelOffer["sourceType"];
  externalRedirectUrl?: string;
};

/** Canonical shape `VehicleCard` renders, whether the row is direct fleet or an external offer. */
export type VehicleCardData = {
  id: string;
  brand: string;
  model: string;
  year?: number | null;
  seats?: number | null;
  transmission: string;
  pricePerDay: unknown;
  currency: ExternalCarOffer["priceCurrency"];
  mainImageUrl: string | null;
  media?: { url: string }[];
  branch?: { city: { name: unknown } | null } | null;
  /** Absent (→ DIRECT_TRAVLBOK) for TravlBok's own fleet. Never rendered as UI copy. */
  sourceType?: ExternalCarOffer["sourceType"];
  externalRedirectUrl?: string;
};

export function toHotelCardData(offer: ExternalHotelOffer, locale: string): HotelCardData {
  return {
    id: offer.id,
    name: offer.name,
    mainImageUrl: offer.imageUrl,
    starRating: offer.starRating,
    city: { name: { en: offer.cityName, fr: offer.cityName, ar: offer.cityName } },
    fromPrice: offer.priceAmount,
    fromPriceCurrency: offer.priceCurrency,
    avgRating: offer.avgRating,
    sourceType: offer.sourceType,
    externalRedirectUrl: buildGoHref({
      locale,
      vertical: "hotel",
      provider: offer.provider,
      offerId: offer.id,
      url: offer.redirectUrl,
      sourceType: offer.sourceType,
    }),
  };
}

export function toVehicleCardData(offer: ExternalCarOffer, locale: string): VehicleCardData {
  return {
    id: offer.id,
    brand: offer.brand,
    model: offer.model,
    transmission: offer.transmission,
    pricePerDay: offer.priceAmount,
    currency: offer.priceCurrency,
    mainImageUrl: offer.imageUrl,
    sourceType: offer.sourceType,
    externalRedirectUrl: buildGoHref({
      locale,
      vertical: "car",
      provider: offer.provider,
      offerId: offer.id,
      url: offer.redirectUrl,
      sourceType: offer.sourceType,
    }),
  };
}

/**
 * No direct flight inventory exists (nor should any be invented) — `FlightCard`
 * already consumes `ExternalFlightOffer` as-is. Kept for the same normalize/
 * card-data shape as hotels/cars so a future direct-flight source (or a second
 * external provider needing reconciliation) has a seam to land in.
 */
export function toFlightCardData(offer: ExternalFlightOffer): ExternalFlightOffer {
  return offer;
}
