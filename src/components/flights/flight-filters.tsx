"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const PRICE_MIN = 0;
const PRICE_MAX = 6000;

export function FlightFilters({ airlines }: { airlines: string[] }) {
  const t = useTranslations("Flights");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [nonStopOnly, setNonStopOnly] = useState(searchParams.get("nonStop") === "1");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>(
    searchParams.get("airlines")?.split(",").filter(Boolean) ?? []
  );

  function setOrDelete(params: URLSearchParams, key: string, value: string | null) {
    if (value) params.set(key, value);
    else params.delete(key);
  }

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    setOrDelete(params, "nonStop", nonStopOnly ? "1" : null);
    setOrDelete(params, "minPrice", minPrice || null);
    setOrDelete(params, "maxPrice", maxPrice || null);
    setOrDelete(params, "airlines", selectedAirlines.length ? selectedAirlines.join(",") : null);
    router.push(`/flights?${params.toString()}`);
  }

  function clearFilters() {
    setNonStopOnly(false);
    setMinPrice("");
    setMaxPrice("");
    setSelectedAirlines([]);
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ["nonStop", "minPrice", "maxPrice", "airlines"]) params.delete(key);
    router.push(`/flights?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold">{t("stops")}</h3>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <Checkbox
            checked={nonStopOnly}
            onCheckedChange={(checked) => setNonStopOnly(checked === true)}
          />
          {t("nonStopOnly")}
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("priceRange")}</h3>
          <span className="text-sm text-muted-foreground">
            {minPrice || PRICE_MIN} – {maxPrice || PRICE_MAX}
          </span>
        </div>
        <Slider
          className="mt-3"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={50}
          value={[Number(minPrice) || PRICE_MIN, Number(maxPrice) || PRICE_MAX]}
          onValueChange={(newValue) => {
            const [next_min, next_max] = newValue as number[];
            setMinPrice(String(next_min));
            setMaxPrice(String(next_max));
          }}
        />
      </div>

      {airlines.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">{t("airlines")}</h3>
          <div className="mt-2 space-y-1.5">
            {airlines.map((airline) => (
              <label key={airline} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedAirlines.includes(airline)}
                  onCheckedChange={(checked) =>
                    setSelectedAirlines((prev) =>
                      checked ? [...prev, airline] : prev.filter((a) => a !== airline)
                    )
                  }
                />
                {airline}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button className="flex-1" onClick={applyFilters}>
          {tCommon("apply")}
        </Button>
        <Button variant="outline" onClick={clearFilters}>
          {tCommon("clearAll")}
        </Button>
      </div>
    </div>
  );
}
