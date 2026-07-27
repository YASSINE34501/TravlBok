import { getTranslations } from "next-intl/server";
import { Plane, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { OfferLink } from "@/components/marketplace/offer-link";
import { getCheckoutMode } from "@/domains/distribution/checkout-mode";
import { buildGoHref } from "@/domains/distribution/checkout-mode";
import { formatMoney } from "@/lib/currency/format";
import type { ExternalFlightOffer } from "@/domains/distribution/types";

function formatTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
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
  const tCommon = await getTranslations({ locale, namespace: "Common" });
  const checkoutMode = getCheckoutMode(offer.sourceType);
  const externalHref = buildGoHref({
    locale,
    vertical: "flight",
    provider: offer.provider,
    offerId: offer.id,
    url: offer.redirectUrl,
    sourceType: offer.sourceType,
  });

  return (
    <OfferLink checkoutMode={checkoutMode} externalHref={externalHref} className="group block">
      <Card className="overflow-hidden rounded-2xl ring-1 ring-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary/20">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Plane className="size-5" />
            </span>
            <div>
              <p className="font-medium text-foreground">{offer.airlineName}</p>
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
              <p className="font-semibold text-foreground">{formatTime(offer.departAt, locale)}</p>
              <p className="text-muted-foreground">{offer.originCode}</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <span className="text-xs">{formatDuration(offer.durationMinutes)}</span>
              <ArrowRight className="size-4 rtl:rotate-180" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{formatTime(offer.arriveAt, locale)}</p>
              <p className="text-muted-foreground">{offer.destinationCode}</p>
            </div>
          </div>

          <div className="text-end">
            <p className="text-lg font-semibold text-foreground">
              {formatMoney(offer.priceAmount, offer.priceCurrency, locale)}
            </p>
            <p className="text-sm text-muted-foreground">{t("perPerson")}</p>
            {/* Decorative only — the whole card is already the click target. */}
            <span
              className={buttonVariants({ size: "sm", className: "mt-2" })}
              aria-hidden="true"
            >
              {tCommon("viewDetails")}
            </span>
          </div>
        </CardContent>
      </Card>
    </OfferLink>
  );
}
