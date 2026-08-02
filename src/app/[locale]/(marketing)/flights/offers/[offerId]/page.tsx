import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Clock, PlaneTakeoff } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getOfferById } from "@/domains/distribution/providers/aviasales-content";
import { getCheckoutMode, buildGoHref } from "@/domains/distribution/checkout-mode";
import { AirlineLogo } from "@/components/flights/airline-logo";
import { CachedPriceNotice } from "@/components/flights/cached-price-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import { getDisplayCurrencyContext, formatFromBase } from "@/lib/currency/display";
import { resolveAirlineBySlug } from "@/lib/travelpayouts/airlines";
import { slugify } from "@/lib/flights/slugs";

// Ephemeral, cache-derived pages with no lasting SEO value — never
// pre-built, never sitemapped, always noindex (see aviasales-content.ts's
// `getOfferById` doc for why this data can't be persisted/guaranteed stable).
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; offerId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FlightsContent" });
  return {
    title: t("offerPageTitle"),
    robots: { index: false, follow: true },
  };
}

function formatDateTime(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
}

export default async function FlightOfferDetailPage({
  params,
}: {
  params: Promise<{ locale: string; offerId: string }>;
}) {
  const { locale, offerId } = await params;
  setRequestLocale(locale);

  const [t, tFlights, tNav, offer, { currency, rates }] = await Promise.all([
    getTranslations({ locale, namespace: "FlightsContent" }),
    getTranslations({ locale, namespace: "Flights" }),
    getTranslations({ locale, namespace: "Nav" }),
    getOfferById(offerId),
    getDisplayCurrencyContext(),
  ]);

  const breadcrumbItems = [
    { label: tNav("flights"), href: "/flights" },
    { label: t("offerPageTitle") },
  ];

  if (!offer) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <BreadcrumbNav items={breadcrumbItems} />
        <EmptyState
          icon={PlaneTakeoff}
          title={t("offerNotFoundTitle")}
          description={t("offerNotFoundDescription")}
          className="mt-8"
          action={
            <Link href="/flights" className={buttonVariants({ variant: "outline" })}>
              {t("offerBackToSearch")}
            </Link>
          }
        />
      </main>
    );
  }

  const price = formatFromBase(offer.priceAmount, "USD", currency, rates, locale);
  const resolvedAirline = await resolveAirlineBySlug(slugify(offer.airlineName));
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
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <JsonLd data={buildBreadcrumbJsonLd(locale, breadcrumbItems)} />
      <BreadcrumbNav items={breadcrumbItems} />

      <div className="mt-4 flex items-center gap-4">
        {resolvedAirline && <AirlineLogo code={resolvedAirline.code} name={offer.airlineName} size={56} />}
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {offer.originCode} → {offer.destinationCode}
          </h1>
          <p className="text-sm text-muted-foreground">
            {offer.airlineName} · {offer.flightNumber}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t("offerDepartureLabel")}
            </dt>
            <dd className="mt-1 font-medium">{formatDateTime(offer.departAt, locale)}</dd>
          </div>
          {offer.returnAt && (
            <div>
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t("offerReturnLabel")}
              </dt>
              <dd className="mt-1 font-medium">{formatDateTime(offer.returnAt, locale)}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t("offerTransfersLabel")}
            </dt>
            <dd className="mt-1 font-medium">
              {offer.stops === 0 ? tFlights("nonStop") : tFlights("stopsCount", { count: offer.stops })}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <Clock className="size-3" />
              {t("offerDurationLabel")}
            </dt>
            <dd className="mt-1 font-medium">{formatDuration(offer.durationMinutes)}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
          <div>
            <p className="text-2xl font-semibold text-foreground">{price}</p>
            <p className="text-xs text-muted-foreground">{tFlights("recentlyFoundTag")}</p>
          </div>
          {checkoutMode === "EXTERNAL_REDIRECT" ? (
            <a href={externalHref} className={buttonVariants({ size: "lg" })}>
              {tFlights("viewDeal")}
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <CachedPriceNotice locale={locale} />
      </div>
    </main>
  );
}
