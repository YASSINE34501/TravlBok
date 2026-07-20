import { Car, MapPin, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { formatFromBase } from "@/lib/currency/display";
import type { CurrencyCode } from "@/lib/currency/config";

type VehicleCardData = {
  id: string;
  brand: string;
  model: string;
  year: number;
  seats: number;
  transmission: string;
  pricePerDay: unknown;
  currency: CurrencyCode;
  mainImageUrl: string | null;
  media: { url: string }[];
  branch: { city: { name: unknown } | null } | null;
};

export function VehicleCard({
  vehicle,
  locale,
  displayCurrency,
  rates,
}: {
  vehicle: VehicleCardData;
  locale: string;
  displayCurrency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
}) {
  const cityName = vehicle.branch?.city
    ? pickLocaleText(vehicle.branch.city.name as Record<string, unknown>, locale)
    : null;
  const imageUrl = vehicle.mainImageUrl ?? vehicle.media[0]?.url ?? null;

  return (
    <Link href={`/cars/${vehicle.id}`}>
      <Card className="overflow-hidden py-0 transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] w-full bg-muted">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Car className="size-8" />
            </div>
          )}
        </div>
        <CardContent className="space-y-1.5 pb-4">
          <p className="line-clamp-1 font-medium">
            {vehicle.brand} {vehicle.model} · {vehicle.year}
          </p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {cityName && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {cityName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {vehicle.seats}
            </span>
          </div>
          <p className="pt-1 text-sm">
            <span className="font-semibold">
              {formatFromBase(
                vehicle.pricePerDay as string,
                vehicle.currency,
                displayCurrency,
                rates,
                locale
              )}
            </span>
            <span className="text-muted-foreground"> / day</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
