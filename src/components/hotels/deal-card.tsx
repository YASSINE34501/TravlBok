import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Star, MapPin, BedDouble, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
 * Homepage "Exclusive deals" rail card — image top, details below, matching
 * the approved reference layout. Deliberately has no discount badge or
 * struck-through "original price": neither exists in the data model (no
 * per-listing discount/compare-at price), so showing one would be
 * fabricated. Real rating, real review count, real price, real (or
 * curated-fallback) photo only.
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
        className="absolute end-2.5 top-2.5 z-10 flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Heart className="size-4" />
      </button>
      <OfferLink
        checkoutMode={checkoutMode}
        internalHref={`/hotels/${hotel.id}`}
        externalHref={hotel.externalRedirectUrl}
        className="block"
      >
        <Card className="overflow-hidden rounded-2xl py-0 ring-1 ring-border transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:ring-primary/20">
          <div className="relative aspect-[3/2] w-full overflow-hidden bg-muted">
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
          </div>
          <CardContent className="space-y-1.5 pb-4">
            <p className="line-clamp-1 font-semibold text-foreground">{hotel.name}</p>
            {cityName && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5" />
                {cityName}
              </p>
            )}
            {hotel.avgRating ? (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="size-3.5 fill-primary text-primary" />
                <span className="font-medium text-foreground">{hotel.avgRating.toFixed(1)}</span>
                {hotel.reviewCount ? <span>({hotel.reviewCount})</span> : null}
              </p>
            ) : null}
            {hotel.fromPrice ? (
              <p className="pt-1 text-sm">
                <span className="text-muted-foreground">{t("from")} </span>
                <span className="font-semibold text-primary">
                  {formatFromBase(
                    hotel.fromPrice as string,
                    hotel.fromPriceCurrency,
                    displayCurrency,
                    rates,
                    locale
                  )}
                </span>
                <span className="text-muted-foreground"> {t("perNight")}</span>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </OfferLink>
    </div>
  );
}
