import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Star, BedDouble, Heart } from "lucide-react";
import { OfferLink } from "@/components/marketplace/offer-link";
import { getCheckoutMode } from "@/domains/distribution/checkout-mode";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { formatFromBase } from "@/lib/currency/display";
import type { CurrencyCode } from "@/lib/currency/config";
import type { HotelCardData } from "@/domains/distribution/normalize";

const DEAL_IMAGE_BY_CITY: Record<string, string> = {
  bali: "/deals/bali.webp",
  dubai: "/deals/dubai.webp",
  maldives: "/deals/maldives.webp",
  santorini: "/deals/santorini.webp",
};

/**
 * Landscape, photo-overlay card used only by the homepage "Exclusive deals"
 * rail — visually distinct from `HotelCard`'s portrait list-style card,
 * matching the reference's wide deal tiles. Deliberately has no discount
 * badge or struck-through "original price": neither exists in the data
 * model (no per-listing discount/compare-at price), so showing one would be
 * fabricated. Real rating, real price, real (or curated-fallback) photo only.
 */
export async function DealCard({
  hotel,
  locale,
  displayCurrency,
  rates,
}: {
  hotel: HotelCardData;
  locale: string;
  displayCurrency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
}) {
  const t = await getTranslations({ locale, namespace: "Common" });
  const cityName = hotel.city
    ? pickLocaleText(hotel.city.name as Record<string, unknown>, locale)
    : null;
  const checkoutMode = getCheckoutMode(hotel.sourceType ?? "DIRECT_TRAVLBOK");
  const curatedImage = cityName ? DEAL_IMAGE_BY_CITY[cityName.trim().toLowerCase()] : undefined;
  const imageUrl = hotel.mainImageUrl ?? curatedImage;

  return (
    <div className="group relative">
      <button
        type="button"
        disabled
        aria-label={t("saveToWishlist")}
        title={t("comingSoon")}
        className="absolute end-2.5 top-2.5 z-10 flex size-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors disabled:cursor-not-allowed disabled:opacity-80"
      >
        <Heart className="size-4" />
      </button>
      <OfferLink
        checkoutMode={checkoutMode}
        internalHref={`/hotels/${hotel.id}`}
        externalHref={hotel.externalRedirectUrl}
        className="block"
      >
        <div className="relative aspect-[8/5] w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-border transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={hotel.name}
              fill
              sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <BedDouble className="size-8" />
            </div>
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 space-y-1 p-4 text-white">
            <p className="line-clamp-1 font-semibold">{hotel.name}</p>
            {cityName && <p className="text-sm text-white/80">{cityName}</p>}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {hotel.avgRating ? (
                <span className="flex items-center gap-1">
                  <Star className="size-3.5 fill-primary text-primary" />
                  {hotel.avgRating.toFixed(1)}
                </span>
              ) : null}
              {hotel.fromPrice ? (
                <span>
                  {t("from")}{" "}
                  <span className="font-semibold">
                    {formatFromBase(
                      hotel.fromPrice as string,
                      hotel.fromPriceCurrency,
                      displayCurrency,
                      rates,
                      locale
                    )}
                  </span>{" "}
                  {t("perNight")}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </OfferLink>
    </div>
  );
}
