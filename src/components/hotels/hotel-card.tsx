import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Star, MapPin, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { buttonVariants } from "@/components/ui/button";
import { OfferLink } from "@/components/marketplace/offer-link";
import { getCheckoutMode } from "@/domains/distribution/checkout-mode";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { formatFromBase } from "@/lib/currency/display";
import type { CurrencyCode } from "@/lib/currency/config";
import type { HotelCardData } from "@/domains/distribution/normalize";

/**
 * Shown when a hotel has no photo of its own, so a card is never a blank
 * placeholder. One shared generic image by design — it is not a picture of
 * any specific property, which is why it renders with an empty `alt`.
 */
const HOTEL_FALLBACK_IMAGE = "/hotels/fallback.webp";

/**
 * Grid card for a hotel listing.
 *
 * Every card is the same height regardless of how much data its hotel has:
 * the image is a fixed 4:3, the text block flexes, and the CTA is pinned to
 * the bottom with `mt-auto`. Previously the optional city/rating/price lines
 * each shortened the card, so a row mixed several card heights and the CTAs
 * never lined up. This needs `h-full` unbroken from the grid item down to the
 * `Card` — any link in that chain without it collapses the card again.
 */
export async function HotelCard({
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

  return (
    <div className="group relative h-full">
      <button
        type="button"
        disabled
        aria-label={t("saveToWishlist")}
        title={t("comingSoon")}
        className="absolute end-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-colors disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Heart className="size-4" />
      </button>
      <OfferLink
        checkoutMode={checkoutMode}
        internalHref={`/hotels/${hotel.id}`}
        externalHref={hotel.externalRedirectUrl}
        className="block h-full"
      >
        <Card className="flex h-full flex-col gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-[0_2px_8px_-2px_rgb(0_0_0/0.08),0_8px_24px_-8px_rgb(0_0_0/0.10)] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_4px_12px_-2px_rgb(0_0_0/0.10),0_16px_40px_-12px_rgb(0_0_0/0.18)]">
          <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden bg-muted">
            <Image
              src={hotel.mainImageUrl ?? HOTEL_FALLBACK_IMAGE}
              /*
                A hotel with no photo of its own falls back to one shared
                generic image. `alt` is empty in that case on purpose: the
                photo is decorative, not a depiction of this property, and
                announcing it as the hotel's own picture would be inaccurate.
              */
              alt={hotel.mainImageUrl ? hotel.name : ""}
              fill
              sizes="(min-width: 1280px) 300px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            {hotel.starRating ? (
              <Badge className="absolute start-3 top-3 gap-1 bg-background/90 text-foreground shadow-sm ring-1 ring-black/5 backdrop-blur-md">
                <StarRating rating={hotel.starRating} size="sm" />
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col p-4">
            <p className="line-clamp-1 text-lg font-semibold tracking-tight text-foreground">
              {hotel.name}
            </p>
            {cityName && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="line-clamp-1">{cityName}</span>
              </p>
            )}
            {hotel.avgRating ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm">
                <Star className="size-3.5 shrink-0 fill-primary text-primary" />
                <span className="font-semibold text-foreground">
                  {hotel.avgRating.toFixed(1)}
                </span>
                {hotel.reviewCount ? (
                  <span className="text-muted-foreground">({hotel.reviewCount})</span>
                ) : null}
              </p>
            ) : null}
            {hotel.fromPrice ? (
              <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
                <span className="text-xs text-muted-foreground">{t("from")}</span>
                <span className="text-lg font-bold tracking-tight text-foreground">
                  {formatFromBase(
                    hotel.fromPrice as string,
                    hotel.fromPriceCurrency,
                    displayCurrency,
                    rates,
                    locale
                  )}
                </span>
                <span className="text-xs text-muted-foreground">{t("perNight")}</span>
              </p>
            ) : null}
            {/* Decorative only — the whole card is already the click target (see
                `OfferLink` above); this just mirrors the reference's visible
                per-row CTA. Rendered as a span, never a nested interactive
                element, since it lives inside the card's own Link/`<a>`.
                `mt-auto` is what keeps every CTA on a shared baseline. */}
            <div className="mt-auto pt-4">
              <span
                className={buttonVariants({
                  className: "w-full justify-center rounded-xl font-semibold",
                })}
                aria-hidden="true"
              >
                {t("viewDetails")}
              </span>
            </div>
          </div>
        </Card>
      </OfferLink>
    </div>
  );
}
