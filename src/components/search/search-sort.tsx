"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SearchSort({ basePath }: { basePath: string }) {
  const t = useTranslations("Search");
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "recommended";

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "recommended") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  const sortItems = {
    recommended: t("sortRecommended"),
    price_asc: t("sortPriceLowToHigh"),
    price_desc: t("sortPriceHighToLow"),
    rating: t("sortRating"),
  };

  return (
    <Select items={sortItems} value={currentSort} onValueChange={handleChange}>
      <SelectTrigger className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="recommended">{t("sortRecommended")}</SelectItem>
        <SelectItem value="price_asc">{t("sortPriceLowToHigh")}</SelectItem>
        <SelectItem value="price_desc">{t("sortPriceHighToLow")}</SelectItem>
        <SelectItem value="rating">{t("sortRating")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
