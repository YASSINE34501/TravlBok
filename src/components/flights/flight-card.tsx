import { getTranslations } from "next-intl/server";
import { Plane, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { OfferLink } from "@/components/marketplace/offer-link";
import { getCheckoutMode } from "@/domains/distribution/checkout-mode";
import { buildGoHref } from "@/domains/distribution/checkout-mode";
import { formatMoney } from "@/lib/currency/format";
import type { ExternalFlightOffer } from "@/domains/distribution/types";

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
}

export async function FlightCard({
  offer,
  locale,
}: {
  offer: ExternalFlightOffer;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "Flights" });
  const checkoutMode = getCheckoutMode(offer.sourceType);
  const externalHref = buildGoHref({
    locale,
    vertical: "flight",
    provider: offer.provider,
    offerId: offer.id,
    url: offer.redirectUrl,
    sourceType: offer.sourceType,
  });

  const alternativeLabel =
    offer.alternativeType === "NEARBY_DATES"
      ? t("alternativeNearbyDates")
      : offer.alternativeType === "MONTHLY"
        ? t("alternativeMonthly")
        : offer.alternativeType === "ONE_WAY"
          ? t("alternativeOneWay")
          : null;

  return (
    <OfferLink checkoutMode={checkoutMode} externalHref={externalHref} className="group block">
      <Card
        className={`overflow-hidden rounded-2xl ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary/20 ${
          alternativeLabel ? "ring-warning/30" : "ring-border"
        }`}
      >
        {alternativeLabel && (
          <div className="border-b border-warning/20 bg-warning/10 px-4 py-1.5">
            <Badge variant="warning">{alternativeLabel}</Badge>
          </div>
        )}
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Plane className="size-5" />
            </span>
            <div>
              <p className="font-medium text-foreground">
                {offer.airlineName} <span className="text-muted-foreground">· {offer.flightNumber}</span>
              </p>
              {offer.stops === 0 ? (
                <Badge variant="success" className="mt-1">
                  {t("nonStop")}
                </Badge>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("stopsCount", { count: offer.stops })}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="text-center">
              <p className="font-semibold text-foreground">{offer.originCode}</p>
              <p className="text-muted-foreground">{formatDate(offer.departAt, locale)}</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <span className="flex items-center gap-1 text-xs">
                <Clock className="size-3" />
                {formatDuration(offer.durationMinutes)}
              </span>
              <ArrowRight className="size-4 rtl:rotate-180" />
              {offer.returnAt && (
                <span className="text-xs">{t("returnOn", { date: formatDate(offer.returnAt, locale) })}</span>
              )}
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{offer.destinationCode}</p>
              <p className="text-muted-foreground">
                {offer.returnAt ? t("roundTrip") : t("oneWay")}
              </p>
            </div>
          </div>

          <div className="text-end">
            <p className="text-lg font-semibold text-foreground">
              {formatMoney(offer.priceAmount, offer.priceCurrency, locale)}
            </p>
            {offer.isCachedPrice && (
              <p className="text-xs text-muted-foreground">{t("recentlyFoundTag")}</p>
            )}
            {/* Decorative only — the whole card is already the click target. */}
            <span
              className={buttonVariants({ size: "sm", className: "mt-2" })}
              aria-hidden="true"
            >
              {t("viewDeal")}
            </span>
          </div>
        </CardContent>
      </Card>
    </OfferLink>
  );
}
