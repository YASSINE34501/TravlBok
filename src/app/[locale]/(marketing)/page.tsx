import { setRequestLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { HeroSearch } from "@/components/search/hero-search";
import { HotelCard } from "@/components/hotels/hotel-card";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import {
  getFeaturedHotels,
  getPopularDestinations,
} from "@/domains/hotels/queries";
import { getFeaturedVehicles } from "@/domains/vehicles/queries";
import { getDisplayCurrencyContext } from "@/lib/currency/display";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { MapPin } from "lucide-react";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  const { currency, rates } = await getDisplayCurrencyContext();
  const [featuredHotels, featuredVehicles, destinations] = await Promise.all([
    getFeaturedHotels(6),
    getFeaturedVehicles(6),
    getPopularDestinations(6),
  ]);

  return (
    <main>
      <section className="relative bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-20 text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
            {t("heroSubtitle")}
          </p>
        </div>
      </section>

      <div className="mx-auto -mt-20 max-w-6xl px-4">
        <HeroSearch />
      </div>

      {destinations.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold">{t("popularDestinations")}</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {destinations.map(({ city, hotelCount }) => (
              <Link
                key={city.id}
                href={`/hotels?destination=${encodeURIComponent(
                  pickLocaleText(city.name as Record<string, unknown>, locale)
                )}`}
                className="group flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors hover:border-primary/40 hover:bg-muted/50"
              >
                <MapPin className="size-5 text-primary" />
                <span className="text-sm font-medium">
                  {pickLocaleText(city.name as Record<string, unknown>, locale)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {hotelCount}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featuredHotels.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{t("featuredHotels")}</h2>
            <Button variant="ghost" render={<Link href="/hotels" />}>
              →
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {featuredHotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                locale={locale}
                displayCurrency={currency}
                rates={rates}
              />
            ))}
          </div>
        </section>
      )}

      {featuredVehicles.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{t("featuredVehicles")}</h2>
            <Button variant="ghost" render={<Link href="/cars" />}>
              →
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {featuredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                locale={locale}
                displayCurrency={currency}
                rates={rates}
              />
            ))}
          </div>
        </section>
      )}

      <section className="bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-8">
            <h3 className="text-xl font-semibold">{t("partnerCta")}</h3>
            <p className="mt-2 text-muted-foreground">
              {t("partnerCtaDescription")}
            </p>
            <Button className="mt-4" render={<Link href="/become-a-partner" />}>
              {t("partnerCtaButton")}
            </Button>
          </div>
          <div className="rounded-xl border bg-card p-8">
            <h3 className="text-xl font-semibold">{t("affiliateCta")}</h3>
            <p className="mt-2 text-muted-foreground">
              {t("affiliateCtaDescription")}
            </p>
            <Button
              variant="secondary"
              className="mt-4"
              render={<Link href="/affiliate" />}
            >
              {t("affiliateCtaButton")}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
