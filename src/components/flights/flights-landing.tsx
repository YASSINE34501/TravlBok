import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  Plane,
  MapPin,
  TrendingUp,
  Clock,
  CalendarDays,
  Wallet,
  ShieldCheck,
  Luggage,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FlightSearchForm } from "@/components/flights/flight-search-form";
import { formatFromBase } from "@/lib/currency/display";
import type { CurrencyCode } from "@/lib/currency/config";
import {
  getPopularRoutes,
  getCheapestThisWeek,
  getTopDestinations,
  getFeaturedAirlines,
  getBestPricesByMonth,
} from "@/domains/distribution/providers/aviasales-landing";

/**
 * TravlBok's home-market anchor for the /flights landing page's real-data
 * sections (Popular Routes, Cheapest This Week, etc.) — Casablanca, matching
 * the rest of the site's Morocco-first seed data. Not a per-user setting;
 * every section below queries Travelpayouts live from this origin and hides
 * itself if that call comes back empty — nothing here is invented.
 */
const LANDING_ORIGIN = "CMN";

function relativeDaysAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

export async function FlightsLanding({
  locale,
  currency,
  rates,
}: {
  locale: string;
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
}) {
  const t = await getTranslations({ locale, namespace: "FlightsLanding" });

  const [popularRoutes, cheapestThisWeek, topDestinations, featuredAirlines] = await Promise.all([
    getPopularRoutes(LANDING_ORIGIN),
    getCheapestThisWeek(LANDING_ORIGIN),
    getTopDestinations(LANDING_ORIGIN),
    getFeaturedAirlines(LANDING_ORIGIN),
  ]);
  // Anchors the monthly-price strip to the single cheapest real popular
  // route, so the section reads as "this specific, real destination" rather
  // than an arbitrary/invented one.
  const monthlyAnchor = popularRoutes[0] ?? null;
  const monthlyPrices = monthlyAnchor
    ? await getBestPricesByMonth(LANDING_ORIGIN, monthlyAnchor.destinationCode)
    : [];

  const price = (amount: number) => formatFromBase(amount, "USD", currency, rates, locale);
  const monthLabel = (month: string) =>
    new Date(`${month}-01`).toLocaleDateString(locale, { month: "long", year: "numeric" });
  const dateLabel = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" });

  const travelTips = [
    { icon: CalendarDays, title: t("tipBookAheadTitle"), description: t("tipBookAheadDescription") },
    { icon: Clock, title: t("tipWeekdayTitle"), description: t("tipWeekdayDescription") },
    { icon: Wallet, title: t("tipFlexibleTitle"), description: t("tipFlexibleDescription") },
    { icon: Luggage, title: t("tipBaggageTitle"), description: t("tipBaggageDescription") },
  ];

  const faqItems = [
    { q: t("faqAccuracyQuestion"), a: t("faqAccuracyAnswer") },
    { q: t("faqBookingQuestion"), a: t("faqBookingAnswer") },
    { q: t("faqPaymentQuestion"), a: t("faqPaymentAnswer") },
    { q: t("faqChangesQuestion"), a: t("faqChangesAnswer") },
  ];

  return (
    <main>
      {/* 1. Hero Flight Search */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0">
          <Image
            src="/hero/airplane-sunset.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0 ltr:hidden rtl:block"
            style={{
              backgroundImage:
                "linear-gradient(to left, oklch(0.16 0.03 264 / 0.62) 0%, oklch(0.16 0.03 264 / 0.5) 28%, oklch(0.16 0.03 264 / 0.26) 52%, oklch(0.16 0.03 264 / 0.06) 72%, transparent 85%)",
            }}
          />
          <div
            className="absolute inset-0 ltr:block rtl:hidden"
            style={{
              backgroundImage:
                "linear-gradient(to right, oklch(0.16 0.03 264 / 0.62) 0%, oklch(0.16 0.03 264 / 0.5) 28%, oklch(0.16 0.03 264 / 0.26) 52%, oklch(0.16 0.03 264 / 0.06) 72%, transparent 85%)",
            }}
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20">
          <div className="max-w-xl text-start">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-sm">
              <Plane className="size-3.5" />
              {t("heroBadge")}
            </span>
            <h1 className="mt-4 text-4xl leading-[1.05] font-bold tracking-tight text-balance text-white drop-shadow-sm sm:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-5 max-w-lg text-lg text-white/85">{t("heroSubtitle")}</p>
          </div>
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20">
          <FlightSearchForm />
        </div>
      </section>

      {/* 2. Popular Routes */}
      {popularRoutes.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              <h2 className="text-2xl font-semibold tracking-tight">{t("popularRoutesTitle")}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t("popularRoutesSubtitle", { origin: LANDING_ORIGIN })}</p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {popularRoutes.map((route) => (
                <Link
                  key={route.destinationCode}
                  href={`/flights?origin=${LANDING_ORIGIN}&destination=${route.destinationCode}&passengers=1`}
                  className="group block rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary/20"
                >
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{LANDING_ORIGIN}</span>
                    <Plane className="size-3.5 rtl:-scale-x-100" />
                    <span className="font-semibold text-foreground">{route.destinationCode}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{route.destinationName}</p>
                  <p className="mt-3 text-lg font-semibold text-primary">{price(route.priceAmount)}</p>
                  <p className="text-xs text-muted-foreground">{route.airlineName}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Cheapest Flights This Week */}
      {cheapestThisWeek.length > 0 && (
        <section className="bg-muted/30 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              <h2 className="text-2xl font-semibold tracking-tight">{t("cheapestThisWeekTitle")}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t("cheapestThisWeekSubtitle")}</p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cheapestThisWeek.map((fare, i) => (
                <Link
                  key={`${fare.destinationCode}-${i}`}
                  href={`/flights?origin=${LANDING_ORIGIN}&destination=${fare.destinationCode}&departDate=${fare.departDate}${fare.returnDate ? `&returnDate=${fare.returnDate}` : ""}&passengers=1`}
                  className="group block rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary/20"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">{fare.destinationName}</p>
                    <Badge variant="success" className="text-[10px]">
                      {t("foundDaysAgo", { count: relativeDaysAgo(fare.foundAt) })}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{dateLabel(fare.departDate)}</p>
                  <p className="mt-3 text-lg font-semibold text-primary">{price(fare.priceAmount)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Top Destinations */}
      {topDestinations.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              <h2 className="text-2xl font-semibold tracking-tight">{t("topDestinationsTitle")}</h2>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {topDestinations.map((dest) => (
                <Link
                  key={dest.code}
                  href={`/flights?origin=${LANDING_ORIGIN}&destination=${dest.code}&passengers=1`}
                  className="group relative block aspect-2/3 overflow-hidden rounded-xl bg-muted"
                >
                  {dest.imageUrl ? (
                    <Image
                      src={dest.imageUrl}
                      alt=""
                      fill
                      sizes="200px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                      <Plane className="size-6" />
                    </div>
                  )}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-linear-to-t from-black/75 via-black/5 to-transparent"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
                    <p className="line-clamp-1 text-sm font-semibold">{dest.name}</p>
                    <p className="text-[11px] font-semibold text-primary">
                      {t("startingFromPrice", { price: price(dest.fromPriceAmount) })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Featured Airlines */}
      {featuredAirlines.length > 0 && (
        <section className="bg-muted/30 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">{t("featuredAirlinesTitle")}</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {featuredAirlines.map((airline) => (
                <span
                  key={airline.code}
                  className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm"
                >
                  <Plane className="size-4 text-primary" />
                  {airline.name}
                  <Badge variant="secondary" className="text-[10px]">
                    {t("routeCount", { count: airline.routeCount })}
                  </Badge>
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Best Prices by Month */}
      {monthlyAnchor && monthlyPrices.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("bestPricesByMonthTitle", { destination: monthlyAnchor.destinationName })}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("bestPricesByMonthSubtitle")}</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {monthlyPrices.map((entry) => (
                <div key={entry.month} className="rounded-xl border bg-card p-4 text-center shadow-sm">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {monthLabel(entry.month)}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-primary">{price(entry.minPriceAmount)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Travel Tips */}
      <section className="bg-muted/30 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">{t("travelTipsTitle")}</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {travelTips.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="rounded-2xl p-6">
                <CardContent className="p-0">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight">{t("faqTitle")}</h2>
          </div>
          <Accordion className="mt-6">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </main>
  );
}
