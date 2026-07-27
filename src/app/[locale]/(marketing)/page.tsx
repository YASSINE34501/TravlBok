import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  ArrowRight,
  MapPin,
  Handshake,
  Link2,
  BadgePercent,
  ShieldCheck,
  Headset,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0">
          <Image
            src="/hero/airplane-approved.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/*
            Physically left-to-right gradient (not logical start/end): this
            overlay is anchored to the photo's fixed composition, not to
            reading direction, so it must stay put in both LTR and RTL —
            only the text block's own alignment adapts per locale below.
            Solid only behind the text column, clear by ~70% so the plane
            reads clearly rather than being washed out.
          */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--background) 0%, var(--background) 32%, color-mix(in oklch, var(--background) 35%, transparent) 55%, transparent 72%)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-32 sm:px-6 sm:pt-28 sm:pb-40">
          <div className="max-w-xl text-left">
            <h1 className="text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              {t("heroSubtitle")}
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-20 max-w-7xl px-4 sm:-mt-24 sm:px-6">
        <HeroSearch />
        <div className="mx-auto mt-6 max-w-4xl rounded-2xl border bg-card p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { icon: BadgePercent, title: t("trustBestPrices"), description: t("trustBestPricesDescription") },
              { icon: ShieldCheck, title: t("trustSecureBooking"), description: t("trustSecureBookingDescription") },
              { icon: Headset, title: t("trustSupport"), description: t("trustSupportDescription") },
              { icon: RefreshCw, title: t("trustFlexible"), description: t("trustFlexibleDescription") },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:items-start sm:gap-3 sm:text-start">
                <Icon className="size-6 shrink-0 text-primary" strokeWidth={1.75} />
                <div>
                  <p className="text-sm font-semibold text-primary">{title}</p>
                  <p className="hidden text-xs text-muted-foreground sm:block">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {destinations.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("popularDestinations")}
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {destinations.map(({ city, hotelCount }) => {
              const cityName = pickLocaleText(
                city.name as Record<string, unknown>,
                locale
              );
              return (
                <Link
                  key={city.id}
                  href={`/hotels?destination=${encodeURIComponent(cityName)}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-primary/20"
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <MapPin className="size-5" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{cityName}</span>
                  <span className="text-xs text-muted-foreground">{hotelCount}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {featuredHotels.length > 0 && (
        <section className="bg-muted/30 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("featuredHotels")}
              </h2>
              <Button variant="ghost" className="gap-1.5" render={<Link href="/hotels" />}>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </section>
      )}

      {featuredVehicles.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("featuredVehicles")}
              </h2>
              <Button variant="ghost" className="gap-1.5" render={<Link href="/cars" />}>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </section>
      )}

      <section className="bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 sm:px-6">
          <Card className="rounded-2xl p-8">
            <CardContent className="p-0">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Handshake className="size-5" />
              </span>
              <h3 className="mt-4 text-xl font-semibold">{t("partnerCta")}</h3>
              <p className="mt-2 text-muted-foreground">{t("partnerCtaDescription")}</p>
              <Button className="mt-5" render={<Link href="/become-a-partner" />}>
                {t("partnerCtaButton")}
              </Button>
            </CardContent>
          </Card>
          <Card className="rounded-2xl p-8">
            <CardContent className="p-0">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Link2 className="size-5" />
              </span>
              <h3 className="mt-4 text-xl font-semibold">{t("affiliateCta")}</h3>
              <p className="mt-2 text-muted-foreground">{t("affiliateCtaDescription")}</p>
              <Button
                variant="secondary"
                className="mt-5"
                render={<Link href="/affiliate" />}
              >
                {t("affiliateCtaButton")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
