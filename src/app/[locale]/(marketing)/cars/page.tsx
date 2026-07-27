import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { SearchX } from "lucide-react";
import { searchVehicles } from "@/domains/vehicles/queries";
import { searchExternalOffers } from "@/domains/distribution/search";
import { toVehicleCardData } from "@/domains/distribution/normalize";
import { prisma } from "@/lib/db";
import { getDisplayCurrencyContext } from "@/lib/currency/display";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { VehicleFilters } from "@/components/vehicles/vehicle-filters";
import { SearchSort } from "@/components/search/search-sort";
import { SearchSummaryBar } from "@/components/search/search-summary-bar";
import { Pagination } from "@/components/search/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import type { FuelType, TransmissionType } from "@/generated/prisma/client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("carsTitle"), description: t("carsDescription") };
}

export default async function CarsSearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const t = await getTranslations("Search");
  const tCommon = await getTranslations("Common");

  const { currency, rates } = await getDisplayCurrencyContext();

  const [{ vehicles, total, page, pageSize }, categories, externalOffers] = await Promise.all([
    searchVehicles({
      location: query.location,
      dropoffLocation: query.dropoffLocation,
      pickupAt: query.pickupDate ? new Date(query.pickupDate) : undefined,
      returnAt: query.returnDate ? new Date(query.returnDate) : undefined,
      categoryCode: query.category,
      brand: query.brand,
      transmission: query.transmission as TransmissionType | undefined,
      fuel: query.fuel as FuelType | undefined,
      minSeats: query.minSeats ? Number(query.minSeats) : undefined,
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      unlimitedMileage: query.unlimitedMileage === "1",
      insuranceRequired: query.insurance === "1",
      deliveryRequired: query.delivery === "1",
      sort: (query.sort as "recommended" | "price_asc" | "price_desc") ?? "recommended",
      page: query.page ? Number(query.page) : 1,
    }),
    prisma.category.findMany({ where: { type: "VEHICLE_CATEGORY" } }),
    searchExternalOffers("CAR", {
      location: query.location,
      dropoffLocation: query.dropoffLocation,
      pickupDate: query.pickupDate,
      returnDate: query.returnDate,
    }),
  ]);

  const categoryOptions = categories.map((c) => ({
    id: c.id,
    code: c.code,
    name: pickLocaleText(c.name as Record<string, unknown>, locale),
  }));

  // Empty in production today (no external car provider configured yet) —
  // this merge is future-proofing, not fabricated data. See
  // src/domains/distribution/providers/registry.ts.
  const externalCards = externalOffers.map((offer) => toVehicleCardData(offer, locale));

  const allResults = [...vehicles, ...externalCards];
  const combinedTotal = total + externalCards.length;

  const summaryItems: Array<{ label: string; value: string }> = [];
  if (query.location) summaryItems.push({ label: t("pickupLocation"), value: query.location });
  if (query.pickupDate && query.returnDate) {
    summaryItems.push({ label: `${t("pickupDate")} / ${t("returnDate")}`, value: `${query.pickupDate} → ${query.returnDate}` });
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      {summaryItems.length > 0 && (
        <SearchSummaryBar items={summaryItems} modifyLabel={t("modifySearch")} />
      )}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("resultsCount", { count: combinedTotal })}
        </h1>
        <SearchSort
          basePath="/cars"
          options={[
            { value: "recommended", label: t("sortRecommended") },
            { value: "price_asc", label: t("sortPriceLowToHigh") },
            { value: "price_desc", label: t("sortPriceHighToLow") },
          ]}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border bg-card p-5 shadow-sm md:h-fit">
          <VehicleFilters categories={categoryOptions} />
        </aside>

        <div>
          {allResults.length === 0 ? (
            <EmptyState icon={SearchX} title={tCommon("noResults")} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {allResults.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  locale={locale}
                  displayCurrency={currency}
                  rates={rates}
                />
              ))}
            </div>
          )}
          <Pagination basePath="/cars" total={total} page={page} pageSize={pageSize} />
        </div>
      </div>
    </main>
  );
}
