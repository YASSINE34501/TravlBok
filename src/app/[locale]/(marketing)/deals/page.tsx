import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Tag } from "lucide-react";
import { searchHotels } from "@/domains/hotels/queries";
import { getDisplayCurrencyContext } from "@/lib/currency/display";
import { HotelCard } from "@/components/hotels/hotel-card";
import { EmptyState } from "@/components/ui/empty-state";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("dealsTitle"), description: t("dealsDescription") };
}

export default async function DealsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tCommon = await getTranslations("Common");

  const { currency, rates } = await getDisplayCurrencyContext();
  const { hotels } = await searchHotels({ sort: "price_asc", pageSize: 12 });

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t("lastMinuteDeals")}</h1>
      <p className="mt-2 text-muted-foreground">{t("specialOffers")}</p>

      {hotels.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={Tag} title={tCommon("noResults")} />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
    </main>
  );
}
