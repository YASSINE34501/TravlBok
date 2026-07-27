"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type SearchSortOption = { value: string; label: string };

/**
 * Segmented sort tabs (Best/Cheapest/Fastest-style), reused across Hotels,
 * Cars, and Flights — each caller supplies its own vertical-appropriate
 * options. `options[0]` is treated as the default ("recommended"/"best")
 * and omitted from the URL when selected, matching the prior dropdown's
 * behavior.
 */
export function SearchSort({
  basePath,
  options,
}: {
  basePath: string;
  options: SearchSortOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? options[0]?.value;

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === options[0]?.value) {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <Tabs value={currentSort} onValueChange={(value) => handleChange(value as string | null)}>
      <TabsList className="h-10 p-1">
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value} className="px-3.5">
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
