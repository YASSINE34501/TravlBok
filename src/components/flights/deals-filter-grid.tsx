"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { FareCard } from "@/components/flights/fare-card";
import { convertAmount } from "@/lib/currency/convert";
import { formatMoney } from "@/lib/currency/format";
import type { CurrencyCode } from "@/lib/currency/config";
import type { CachedDeal } from "@/domains/distribution/providers/aviasales-content";

const PRICE_MIN = 0;
const PRICE_MAX = 3000;

/**
 * Client-side filtering over an already-fetched, bounded set of real deals
 * — never a new API call, never alters what was fetched server-side. Reuses
 * the same `Checkbox`/`Slider` primitives `FlightFilters` uses on the
 * results page.
 *
 * Takes `currency`/`rates` (plain serializable data) rather than a
 * `formatPrice` callback — a Server Component can't pass a function prop
 * across the RSC boundary into a Client Component, so formatting happens
 * here using the same non-server-only `convertAmount`/`formatMoney` helpers
 * the server-side `price()` closure elsewhere on this page wraps.
 */
export function DealsFilterGrid({
  deals,
  locale,
  currency,
  rates,
}: {
  deals: CachedDeal[];
  locale: string;
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
}) {
  const t = useTranslations("Flights");
  const tContent = useTranslations("FlightsContent");
  const [nonStopOnly, setNonStopOnly] = useState(false);
  const [oneWayOnly, setOneWayOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);

  const filtered = useMemo(() => {
    return deals.filter((deal) => {
      if (nonStopOnly && deal.stops !== 0) return false;
      if (oneWayOnly && deal.returnDate) return false;
      if (deal.priceAmount < priceRange[0] || deal.priceAmount > priceRange[1]) return false;
      return true;
    });
  }, [deals, nonStopOnly, oneWayOnly, priceRange]);

  function formatPrice(amountUsd: number) {
    return formatMoney(convertAmount(amountUsd, "USD", currency, rates), currency, locale);
  }

  function formatDealDate(iso: string) {
    return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" });
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr]">
      <aside className="space-y-6 rounded-2xl border bg-card p-5 shadow-sm md:h-fit">
        <div>
          <h3 className="text-sm font-semibold">{t("stops")}</h3>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <Checkbox checked={nonStopOnly} onCheckedChange={(checked) => setNonStopOnly(checked === true)} />
            {t("nonStopOnly")}
          </label>
        </div>
        <div>
          <h3 className="text-sm font-semibold">{tContent("oneWayOnly")}</h3>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <Checkbox checked={oneWayOnly} onCheckedChange={(checked) => setOneWayOnly(checked === true)} />
            {t("oneWay")}
          </label>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t("priceRange")}</h3>
            <span className="text-xs text-muted-foreground">
              {formatPrice(priceRange[0])} – {formatPrice(priceRange[1])}
            </span>
          </div>
          <Slider
            className="mt-3"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={50}
            value={priceRange}
            onValueChange={(next) => setPriceRange(next as [number, number])}
          />
        </div>
      </aside>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((deal, index) => (
          <FareCard
            key={`${deal.destinationCode}-${index}`}
            href={`/flights?origin=CMN&destination=${deal.destinationCode}&departDate=${deal.departDate}${
              deal.returnDate ? `&returnDate=${deal.returnDate}` : ""
            }&passengers=1`}
            title={deal.destinationName}
            priceLabel={formatPrice(deal.priceAmount)}
            subtitle={formatDealDate(deal.departDate)}
            badgeLabel={deal.stops === 0 ? t("nonStop") : undefined}
            badgeVariant="success"
          />
        ))}
      </div>
    </div>
  );
}
