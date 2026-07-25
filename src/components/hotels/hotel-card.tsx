import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Star, MapPin, BedDouble } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { formatFromBase } from "@/lib/currency/display";
import type { CurrencyCode } from "@/lib/currency/config";

type HotelCardData = {
  id: string;
  name: string;
  mainImageUrl: string | null;
  starRating: number | null;
  city: { name: unknown } | null;
  fromPrice: unknown;
  fromPriceCurrency: CurrencyCode;
  avgRating?: number | null;
};

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

  return (
    <Link href={`/hotels/${hotel.id}`} className="group block">
      <Card className="overflow-hidden rounded-2xl py-0 ring-1 ring-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary/20">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {hotel.mainImageUrl ? (
            <Image
              src={hotel.mainImageUrl}
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
          {hotel.starRating ? (
            <Badge className="absolute start-2.5 top-2.5 gap-1 bg-background/90 text-foreground shadow-sm backdrop-blur-sm">
              <Star className="size-3 fill-accent text-accent" />
              {hotel.starRating}
            </Badge>
          ) : null}
        </div>
        <CardContent className="space-y-1.5 pb-4">
          <p className="line-clamp-1 font-medium text-foreground">{hotel.name}</p>
          {cityName && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {cityName}
            </p>
          )}
          {hotel.avgRating ? (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="size-3.5 fill-accent text-accent" />
              {hotel.avgRating.toFixed(1)}
            </p>
          ) : null}
          {hotel.fromPrice ? (
            <p className="pt-1 text-sm">
              <span className="text-muted-foreground">{t("from")} </span>
              <span className="font-semibold text-foreground">
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
    </Link>
  );
}
