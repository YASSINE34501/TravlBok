"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CategoryOption = { id: string; code: string; name: string };

export function VehicleFilters({ categories }: { categories: CategoryOption[] }) {
  const t = useTranslations("Search");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState(searchParams.get("category") ?? "any");
  const [transmission, setTransmission] = useState(
    searchParams.get("transmission") ?? "any"
  );
  const [fuel, setFuel] = useState(searchParams.get("fuel") ?? "any");
  const [minSeats, setMinSeats] = useState(searchParams.get("minSeats") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [unlimitedMileage, setUnlimitedMileage] = useState(
    searchParams.get("unlimitedMileage") === "1"
  );

  const categoryItems: Record<string, string> = {
    any: tCommon("viewAll"),
    ...Object.fromEntries(categories.map((c) => [c.code, c.name])),
  };
  const transmissionItems: Record<string, string> = {
    any: tCommon("viewAll"),
    MANUAL: "Manual",
    AUTOMATIC: "Automatic",
  };
  const fuelItems: Record<string, string> = {
    any: tCommon("viewAll"),
    PETROL: "Petrol",
    DIESEL: "Diesel",
    ELECTRIC: "Electric",
    HYBRID: "Hybrid",
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
    setOrDelete(params, "category", category !== "any" ? category : null);
    setOrDelete(params, "transmission", transmission !== "any" ? transmission : null);
    setOrDelete(params, "fuel", fuel !== "any" ? fuel : null);
    setOrDelete(params, "minSeats", minSeats || null);
    setOrDelete(params, "minPrice", minPrice || null);
    setOrDelete(params, "maxPrice", maxPrice || null);
    setOrDelete(params, "unlimitedMileage", unlimitedMileage ? "1" : null);
    params.delete("page");
    router.push(`/cars?${params.toString()}`);
  }

  function clearFilters() {
    setCategory("any");
    setTransmission("any");
    setFuel("any");
    setMinSeats("");
    setMinPrice("");
    setMaxPrice("");
    setUnlimitedMileage(false);
    router.push("/cars");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold">{t("category")}</h3>
        <Select items={categoryItems} value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger className="mt-2 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{tCommon("viewAll")}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.code}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-sm font-semibold">{t("transmission")}</h3>
        <Select
          items={transmissionItems}
          value={transmission}
          onValueChange={(v) => v && setTransmission(v)}
        >
          <SelectTrigger className="mt-2 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{tCommon("viewAll")}</SelectItem>
            <SelectItem value="MANUAL">Manual</SelectItem>
            <SelectItem value="AUTOMATIC">Automatic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-sm font-semibold">{t("fuel")}</h3>
        <Select items={fuelItems} value={fuel} onValueChange={(v) => v && setFuel(v)}>
          <SelectTrigger className="mt-2 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{tCommon("viewAll")}</SelectItem>
            <SelectItem value="PETROL">Petrol</SelectItem>
            <SelectItem value="DIESEL">Diesel</SelectItem>
            <SelectItem value="ELECTRIC">Electric</SelectItem>
            <SelectItem value="HYBRID">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="min-seats">{t("seats")}</Label>
        <Input
          id="min-seats"
          type="number"
          min={1}
          className="mt-2"
          value={minSeats}
          onChange={(e) => setMinSeats(e.target.value)}
        />
      </div>

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

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={unlimitedMileage}
          onCheckedChange={(checked) => setUnlimitedMileage(checked === true)}
        />
        {t("unlimitedMileage")}
      </label>

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
