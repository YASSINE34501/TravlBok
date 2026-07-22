"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Amenity = { id: string; code: string; name: string };
type PropertyType = { id: string; code: string; name: string };

export function HotelFilters({
  amenities,
  propertyTypes,
}: {
  amenities: Amenity[];
  propertyTypes: PropertyType[];
}) {
  const t = useTranslations("Search");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const propertyTypeItems: Record<string, string> = {
    any: tCommon("viewAll"),
    ...Object.fromEntries(propertyTypes.map((type) => [type.code, type.name])),
  };
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [rooms, setRooms] = useState(searchParams.get("rooms") ?? "");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") ?? "any");
  const [stars, setStars] = useState<string[]>(
    searchParams.get("stars")?.split(",").filter(Boolean) ?? []
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    searchParams.get("amenities")?.split(",").filter(Boolean) ?? []
  );
  const [propertyType, setPropertyType] = useState(
    searchParams.get("propertyType") ?? "any"
  );
  const [breakfastIncluded, setBreakfastIncluded] = useState(
    searchParams.get("breakfast") === "1"
  );
  const [freeCancellation, setFreeCancellation] = useState(
    searchParams.get("freeCancellation") === "1"
  );
  const [paymentOptions, setPaymentOptions] = useState<string[]>(
    searchParams.get("paymentOptions")?.split(",").filter(Boolean) ?? []
  );

  const ratingItems: Record<string, string> = {
    any: tCommon("viewAll"),
    "3": "3+",
    "4": "4+",
    "4.5": "4.5+",
  };

  function setOrDelete(params: URLSearchParams, key: string, value: string | null) {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  }

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    setOrDelete(params, "minPrice", minPrice || null);
    setOrDelete(params, "maxPrice", maxPrice || null);
    setOrDelete(params, "rooms", rooms || null);
    setOrDelete(params, "minRating", minRating !== "any" ? minRating : null);
    setOrDelete(params, "stars", stars.length ? stars.join(",") : null);
    setOrDelete(
      params,
      "amenities",
      selectedAmenities.length ? selectedAmenities.join(",") : null
    );
    setOrDelete(params, "propertyType", propertyType !== "any" ? propertyType : null);
    setOrDelete(params, "breakfast", breakfastIncluded ? "1" : null);
    setOrDelete(params, "freeCancellation", freeCancellation ? "1" : null);
    setOrDelete(
      params,
      "paymentOptions",
      paymentOptions.length ? paymentOptions.join(",") : null
    );
    params.delete("page");
    router.push(`/hotels?${params.toString()}`);
  }

  function clearFilters() {
    setMinPrice("");
    setMaxPrice("");
    setRooms("");
    setMinRating("any");
    setStars([]);
    setSelectedAmenities([]);
    setPropertyType("any");
    setBreakfastIncluded(false);
    setFreeCancellation(false);
    setPaymentOptions([]);
    const params = new URLSearchParams(searchParams.toString());
    for (const key of [
      "minPrice",
      "maxPrice",
      "rooms",
      "minRating",
      "stars",
      "amenities",
      "propertyType",
      "breakfast",
      "freeCancellation",
      "paymentOptions",
      "page",
    ]) {
      params.delete(key);
    }
    router.push(`/hotels?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold">{t("priceRange")}</h3>
        <div className="mt-2 flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">{tCommon("rooms")}</h3>
        <Input
          type="number"
          min={1}
          className="mt-2"
          value={rooms}
          onChange={(e) => setRooms(e.target.value)}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold">{t("rating")}</h3>
        <Select
          items={ratingItems}
          value={minRating}
          onValueChange={(value) => value && setMinRating(value)}
        >
          <SelectTrigger className="mt-2 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ratingItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-sm font-semibold">{t("stars")}</h3>
        <div className="mt-2 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => (
            <label key={star} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={stars.includes(String(star))}
                onCheckedChange={(checked) =>
                  setStars((prev) =>
                    checked
                      ? [...prev, String(star)]
                      : prev.filter((s) => s !== String(star))
                  )
                }
              />
              {"★".repeat(star)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">{t("propertyType")}</h3>
        <Select
          items={propertyTypeItems}
          value={propertyType}
          onValueChange={(value) => value && setPropertyType(value)}
        >
          <SelectTrigger className="mt-2 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{tCommon("viewAll")}</SelectItem>
            {propertyTypes.map((type) => (
              <SelectItem key={type.id} value={type.code}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {amenities.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">{t("amenities")}</h3>
          <div className="mt-2 space-y-1.5">
            {amenities.map((amenity) => (
              <label key={amenity.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedAmenities.includes(amenity.code)}
                  onCheckedChange={(checked) =>
                    setSelectedAmenities((prev) =>
                      checked
                        ? [...prev, amenity.code]
                        : prev.filter((code) => code !== amenity.code)
                    )
                  }
                />
                {amenity.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={breakfastIncluded}
            onCheckedChange={(checked) => setBreakfastIncluded(checked === true)}
          />
          {t("breakfastIncluded")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={freeCancellation}
            onCheckedChange={(checked) => setFreeCancellation(checked === true)}
          />
          {t("freeCancellation")}
        </label>
      </div>

      <div>
        <h3 className="text-sm font-semibold">{t("paymentOptions")}</h3>
        <div className="mt-2 space-y-1.5">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={paymentOptions.includes("PAY_AT_PROPERTY")}
              onCheckedChange={(checked) =>
                setPaymentOptions((prev) =>
                  checked
                    ? [...prev, "PAY_AT_PROPERTY"]
                    : prev.filter((o) => o !== "PAY_AT_PROPERTY")
                )
              }
            />
            {tCommon("payAtProperty")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={paymentOptions.includes("ONLINE_PAYMENT")}
              onCheckedChange={(checked) =>
                setPaymentOptions((prev) =>
                  checked
                    ? [...prev, "ONLINE_PAYMENT"]
                    : prev.filter((o) => o !== "ONLINE_PAYMENT")
                )
              }
            />
            {tCommon("onlinePayment")}
          </label>
        </div>
      </div>

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
