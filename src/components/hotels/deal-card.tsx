import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Star, MapPin, BedDouble, Heart } from "lucide-react";
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
 * Homepage "Exclusive deals" rail card — full-bleed photo with the details
 * overlaid at the bottom, matching the approved reference composition.
 *
 * Deliberately has no discount badge and no struck-through "original price",
 * even though the reference shows both: neither exists in the data model (no
 * per-listing discount or compare-at price), so either would be fabricated.
 * The reference's "Breakfast included" line is omitted for the same reason —
 * `HotelCardData` carries no amenity information. Real rating, real review
 * count, real price, real (or curated-fallback) photo only.
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
        className="absolute end-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-black/25 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors disabled:cursor-not-allowed"
      >
        <Heart className="size-4" />
      </button>
      <OfferLink
        checkoutMode={checkoutMode}
        internalHref={`/hotels/${hotel.id}`}
        externalHref={hotel.externalRedirectUrl}
        className="block"
      >
        <div className="relative aspect-3/2 overflow-hidden rounded-3xl bg-muted shadow-md ring-1 ring-black/5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={hotel.name}
              fill
              sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 85vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
          ) : (
            /*
              The overlaid copy is white, so an empty light placeholder would
              leave the name and price barely legible. A dark brand-tinted
              wash keeps this card readable with no photo at all — the case
              for every hotel whose city isn't in the curated map above.
            */
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-foreground via-foreground/90 to-primary/35 pb-20 text-white/20">
              <BedDouble className="size-10" strokeWidth={1.25} />
            </div>
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 space-y-1 p-4 text-white sm:p-5">
            <p className="line-clamp-1 text-base font-semibold tracking-tight sm:text-lg">
              {hotel.name}
            </p>
            {cityName && (
              <p className="flex items-center gap-1.5 text-sm text-white/80">
                <MapPin className="size-3.5 shrink-0" />
                <span className="line-clamp-1">{cityName}</span>
              </p>
            )}
            {hotel.avgRating ? (
              <p className="flex items-center gap-1.5 pt-0.5 text-sm">
                <Star className="size-3.5 shrink-0 fill-primary text-primary" />
                <span className="font-semibold">{hotel.avgRating.toFixed(1)}</span>
                {hotel.reviewCount ? (
                  <span className="text-white/70">({hotel.reviewCount})</span>
                ) : null}
              </p>
            ) : null}
            {hotel.fromPrice ? (
              <p className="flex flex-wrap items-baseline gap-x-1.5 pt-1.5">
                <span className="text-xs text-white/70">{t("from")}</span>
                <span className="text-xl font-bold text-primary">
                  {formatFromBase(
                    hotel.fromPrice as string,
                    hotel.fromPriceCurrency,
                    displayCurrency,
                    rates,
                    locale
                  )}
                </span>
                <span className="text-xs text-white/70">{t("perNight")}</span>
              </p>
            ) : null}
          </div>
        </div>
      </OfferLink>
    </div>
  );
}
