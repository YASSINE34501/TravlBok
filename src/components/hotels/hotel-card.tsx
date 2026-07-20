import { Star, MapPin } from "lucide-react";
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

export function HotelCard({
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
  const cityName = hotel.city
    ? pickLocaleText(hotel.city.name as Record<string, unknown>, locale)
    : null;

  return (
    <Link href={`/hotels/${hotel.id}`}>
      <Card className="overflow-hidden py-0 transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] w-full bg-muted">
          {hotel.mainImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hotel.mainImageUrl}
              alt={hotel.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <MapPin className="size-8" />
            </div>
          )}
          {hotel.starRating ? (
            <Badge className="absolute start-2 top-2 gap-1 bg-background/90 text-foreground">
              <Star className="size-3 fill-accent text-accent" />
              {hotel.starRating}
            </Badge>
          ) : null}
        </div>
        <CardContent className="space-y-1.5 pb-4">
          <p className="line-clamp-1 font-medium">{hotel.name}</p>
          {cityName && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {cityName}
            </p>
          )}
          {hotel.avgRating ? (
            <p className="text-sm text-muted-foreground">
              ★ {hotel.avgRating.toFixed(1)}
            </p>
          ) : null}
          {hotel.fromPrice ? (
            <p className="pt-1 text-sm">
              <span className="text-muted-foreground">from </span>
              <span className="font-semibold">
                {formatFromBase(
                  hotel.fromPrice as string,
                  hotel.fromPriceCurrency,
                  displayCurrency,
                  rates,
                  locale
                )}
              </span>
              <span className="text-muted-foreground"> / night</span>
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
