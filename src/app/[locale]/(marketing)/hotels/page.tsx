import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { SearchX } from "lucide-react";
import { searchHotels } from "@/domains/hotels/queries";
import { prisma } from "@/lib/db";
import { getDisplayCurrencyContext } from "@/lib/currency/display";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { HotelCard } from "@/components/hotels/hotel-card";
import { HotelFilters } from "@/components/hotels/hotel-filters";
import { SearchSort } from "@/components/search/search-sort";
import { Pagination } from "@/components/search/pagination";
import { EmptyState } from "@/components/ui/empty-state";

type SortOption = "recommended" | "price_asc" | "price_desc" | "rating";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("hotelsTitle"), description: t("hotelsDescription") };
}

export default async function HotelsSearchPage({
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

  const searchInput = {
    destination: query.destination,
    checkInDate: query.checkIn ? new Date(query.checkIn) : undefined,
    checkOutDate: query.checkOut ? new Date(query.checkOut) : undefined,
    guests: query.guests ? Number(query.guests) : undefined,
    rooms: query.rooms ? Number(query.rooms) : undefined,
    minPrice: query.minPrice ? Number(query.minPrice) : undefined,
    maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
    stars: query.stars ? query.stars.split(",").map(Number) : undefined,
    minRating: query.minRating ? Number(query.minRating) : undefined,
    amenities: query.amenities ? query.amenities.split(",") : undefined,
    propertyTypeCode: query.propertyType,
    breakfastIncluded: query.breakfast === "1",
    freeCancellation: query.freeCancellation === "1",
    paymentOptions: query.paymentOptions
      ? (query.paymentOptions.split(",") as ("PAY_AT_PROPERTY" | "ONLINE_PAYMENT")[])
      : undefined,
    sort: (query.sort as SortOption) ?? "recommended",
    page: query.page ? Number(query.page) : 1,
  };

  const [{ hotels, total, page, pageSize }, amenities, propertyTypes] =
    await Promise.all([
      searchHotels(searchInput),
      prisma.amenity.findMany({ where: { category: "HOTEL" } }),
      prisma.category.findMany({ where: { type: "HOTEL_TYPE" } }),
    ]);

  const amenityOptions = amenities.map((a) => ({
    id: a.id,
    code: a.code,
    name: pickLocaleText(a.name as Record<string, unknown>, locale),
  }));
  const propertyTypeOptions = propertyTypes.map((p) => ({
    id: p.id,
    code: p.code,
    name: pickLocaleText(p.name as Record<string, unknown>, locale),
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("resultsCount", { count: total })}
        </h1>
        <SearchSort basePath="/hotels" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border bg-card p-5 shadow-sm md:h-fit">
          <HotelFilters amenities={amenityOptions} propertyTypes={propertyTypeOptions} />
        </aside>

        <div>
          {hotels.length === 0 ? (
            <EmptyState icon={SearchX} title={tCommon("noResults")} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {hotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  locale={locale}
                  displayCurrency={currency}
                  rates={rates}
                />
              ))}
            </div>
          )}
          <Pagination basePath="/hotels" total={total} page={page} pageSize={pageSize} />
        </div>
      </div>
    </main>
  );
}
