import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Car, MapPin, Users, Cog } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { OfferLink } from "@/components/marketplace/offer-link";
import { getCheckoutMode } from "@/domains/distribution/checkout-mode";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { formatFromBase } from "@/lib/currency/display";
import type { CurrencyCode } from "@/lib/currency/config";
import type { VehicleCardData } from "@/domains/distribution/normalize";

export async function VehicleCard({
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
  const t = await getTranslations({ locale, namespace: "Common" });
  const tVehicle = await getTranslations({ locale, namespace: "VehicleAttributes" });
  const cityName = vehicle.branch?.city
    ? pickLocaleText(vehicle.branch.city.name as Record<string, unknown>, locale)
    : null;
  const imageUrl = vehicle.mainImageUrl ?? vehicle.media?.[0]?.url ?? null;
  const transmissionLabel =
    vehicle.transmission === "AUTOMATIC"
      ? tVehicle("transmissionAutomatic")
      : tVehicle("transmissionManual");
  const checkoutMode = getCheckoutMode(vehicle.sourceType ?? "DIRECT_TRAVLBOK");

  return (
    <OfferLink
      checkoutMode={checkoutMode}
      internalHref={`/cars/${vehicle.id}`}
      externalHref={vehicle.externalRedirectUrl}
      className="group block"
    >
      <Card className="overflow-hidden rounded-2xl py-0 ring-1 ring-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary/20">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${vehicle.brand} ${vehicle.model}`}
              fill
              sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Car className="size-8" />
            </div>
          )}
          <Badge className="absolute start-2.5 top-2.5 gap-1 bg-background/90 text-foreground shadow-sm backdrop-blur-sm">
            <Cog className="size-3" />
            {transmissionLabel}
          </Badge>
        </div>
        <CardContent className="space-y-1.5 pb-4">
          <p className="line-clamp-1 font-medium text-foreground">
            {vehicle.brand} {vehicle.model}
            {vehicle.year ? ` · ${vehicle.year}` : ""}
          </p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {cityName && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {cityName}
              </span>
            )}
            {vehicle.seats ? (
              <span className="flex items-center gap-1">
                <Users className="size-3.5" />
                {vehicle.seats}
              </span>
            ) : null}
          </div>
          <p className="pt-1 text-sm">
            <span className="font-semibold text-foreground">
              {formatFromBase(
                vehicle.pricePerDay as string,
                vehicle.currency,
                displayCurrency,
                rates,
                locale
              )}
            </span>
            <span className="text-muted-foreground"> {t("perDay")}</span>
          </p>
          {/* Decorative only — the whole card is already the click target. */}
          <span
            className={buttonVariants({ size: "sm", className: "mt-2 w-full justify-center" })}
            aria-hidden="true"
          >
            {t("viewDetails")}
          </span>
        </CardContent>
      </Card>
    </OfferLink>
  );
}
