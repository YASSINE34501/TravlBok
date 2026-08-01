import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Handshake,
  Link2,
  BadgePercent,
  ShieldCheck,
  Headset,
  RefreshCw,
  CheckCircle2,
  Crown,
  Heart,
  Gift,
  CreditCard,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Link } from "@/i18n/navigation";
import { HeroSearch } from "@/components/search/hero-search";
import { HotelCard } from "@/components/hotels/hotel-card";
import { DealCard } from "@/components/hotels/deal-card";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import {
  getFeaturedHotels,
  getPopularDestinations,
  searchHotels,
} from "@/domains/hotels/queries";
import { getFeaturedVehicles } from "@/domains/vehicles/queries";
import { getDisplayCurrencyContext, formatFromBase } from "@/lib/currency/display";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import type { CurrencyCode } from "@/lib/currency/config";

const DESTINATION_IMAGE_BY_CITY: Record<string, string> = {
  bali: "/destinations/bali.webp",
  dubai: "/destinations/dubai.webp",
  paris: "/destinations/paris.webp",
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tCommon = await getTranslations("Common");

  const { currency, rates } = await getDisplayCurrencyContext();
  const [featuredHotels, featuredVehicles, destinations, dealsResult] = await Promise.all([
    getFeaturedHotels(6),
    getFeaturedVehicles(6),
    getPopularDestinations(6),
    searchHotels({ sort: "price_asc", pageSize: 8 }),
  ]);
  const deals = dealsResult.hotels;

  const destinationCards = destinations.map(({ city, hotelCount, fromPrice }) => {
    const cityName = pickLocaleText(city.name as Record<string, unknown>, locale);
    const countryName = pickLocaleText(
      (city as { country: { name: unknown } }).country.name as Record<string, unknown>,
      locale
    );
    const image = DESTINATION_IMAGE_BY_CITY[cityName.trim().toLowerCase()];
    const fromPriceLabel = fromPrice
      ? t("startingFromPrice", {
          price: formatFromBase(fromPrice.amount.toString(), fromPrice.currency as CurrencyCode, currency, rates, locale),
        })
      : null;
    return { id: city.id, cityName, countryName, hotelCount, fromPriceLabel, image };
  });

  const trustBarPrimary = [
    { icon: BadgePercent, title: t("trustBestPrices"), description: t("trustBestPricesDescription") },
    { icon: Headset, title: t("trustSupport"), description: t("trustSupportDescription") },
    { icon: ShieldCheck, title: t("trustSecureBooking"), description: t("trustSecureBookingDescription") },
    { icon: Gift, title: t("trustMemberRewardsTitle"), description: t("trustMemberRewardsDescription") },
  ];

  const trustBarSecondary = [
    { icon: RefreshCw, title: t("trustFlexible"), description: t("trustFlexibleDescription") },
    { icon: CreditCard, title: t("trustPayTitle"), description: t("trustPayDescription") },
    { icon: Users, title: t("trustPlatformTitle"), description: t("trustPlatformDescription") },
    { icon: Headset, title: t("trustSupport"), description: t("trustSupportDescription") },
  ];

  return (
    <main>
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0">
          <Image
            src="/hero/santorini.webp"
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
            Solid only behind the text column, clear by ~70% so the photo
            reads clearly rather than being washed out.
          */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--background) 0%, var(--background) 30%, color-mix(in oklch, var(--background) 30%, transparent) 52%, transparent 68%)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-28 sm:px-6 sm:pt-20 sm:pb-36">
          <div className="lg:flex lg:items-start lg:justify-between lg:gap-10">
            <div className="max-w-xl text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="size-3.5" />
                {t("heroBadge")}
              </span>
              <h1 className="mt-4 text-4xl leading-[1.05] font-bold tracking-tight text-balance text-foreground sm:text-5xl lg:text-[3.5rem]">
                {t("heroTitle")}
                <br />
                {t("heroTitleLine2")} <span className="text-primary">{t("heroTitleHighlight")}</span>.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                {t("heroSubtitle")}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                {[t("heroBadge"), t("heroCheckSupport"), t("heroCheckCancellation")].map((label) => (
                  <span key={label} className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <CheckCircle2 className="size-4 text-primary" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {destinationCards.length > 0 && (
              <div className="mt-10 hidden shrink-0 gap-4 lg:mt-1 lg:flex lg:w-[600px]">
                <div className="flex w-56 shrink-0 flex-col justify-between rounded-2xl bg-card p-5 shadow-lg">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary uppercase">
                      <Crown className="size-3.5" />
                      {t("memberExclusiveTitle")}
                    </span>
                    <p className="mt-3 text-sm font-medium text-foreground">
                      {t("memberExclusiveDescription")}
                    </p>
                  </div>
                  <Button size="sm" className="mt-4 gap-1.5" render={<Link href="/register" />}>
                    {t("memberExclusiveCta")}
                    <ArrowUpRight className="size-4 rtl:-scale-x-100" />
                  </Button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-white drop-shadow-sm">
                      {t("popularDestinations")}
                    </h2>
                    <Link
                      href="/destinations"
                      className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary drop-shadow-sm hover:underline"
                    >
                      {t("viewAllDestinations")}
                      <ArrowRight className="size-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                  <Carousel className="mt-3">
                    <CarouselContent className="-ms-3">
                      {destinationCards.map((d) => (
                        <CarouselItem key={d.id} className="basis-1/3 ps-3">
                          <DestinationTile {...d} />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselNext
                      aria-label={tCommon("next")}
                      className="end-1 size-8 border-none bg-background/90 shadow-md"
                    />
                  </Carousel>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-24 max-w-7xl px-4 sm:-mt-28 sm:px-6">
        <div className="rounded-3xl border bg-card shadow-xl ring-1 ring-black/5">
          <HeroSearch />
          <div className="border-t px-4 py-4 sm:px-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {trustBarPrimary.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-primary">{title}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {destinationCards.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:hidden">
          <h2 className="text-2xl font-semibold tracking-tight">{t("popularDestinations")}</h2>
          <Carousel className="mt-6">
            <CarouselContent className="-ms-4">
              {destinationCards.map((d) => (
                <CarouselItem key={d.id} className="basis-1/2 ps-4 sm:basis-1/3">
                  <DestinationTile {...d} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious aria-label={tCommon("previous")} />
            <CarouselNext aria-label={tCommon("next")} />
          </Carousel>
        </section>
      )}

      {deals.length > 0 && (
        <section className="bg-muted/30 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("exclusiveDeals")}
              </h2>
              <Button variant="ghost" className="gap-1.5" render={<Link href="/deals" />}>
                {t("viewAllDeals")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Button>
            </div>
            <Carousel className="mt-8">
              <CarouselContent className="-ms-4">
                {deals.map((hotel) => (
                  <CarouselItem key={hotel.id} className="basis-4/5 ps-4 sm:basis-1/2 lg:basis-1/4">
                    <DealCard
                      hotel={hotel}
                      locale={locale}
                      displayCurrency={currency}
                      rates={rates}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious aria-label={tCommon("previous")} />
              <CarouselNext aria-label={tCommon("next")} />
            </Carousel>
          </div>
        </section>
      )}

      {featuredHotels.length > 0 && (
        <section className="py-16 sm:py-20">
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
        <section className="bg-muted/30 py-16 sm:py-20">
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

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {trustBarSecondary.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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

function DestinationTile({
  cityName,
  countryName,
  fromPriceLabel,
  image,
}: {
  cityName: string;
  countryName: string;
  fromPriceLabel: string | null;
  image?: string;
}) {
  return (
    <Link
      href={`/hotels?destination=${encodeURIComponent(cityName)}`}
      className="group relative block aspect-2/3 overflow-hidden rounded-xl bg-muted"
    >
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          sizes="200px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
          <MapPin className="size-6" />
        </div>
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-black/75 via-black/5 to-transparent"
      />
      <button
        type="button"
        disabled
        aria-label={cityName}
        title={cityName}
        className="absolute end-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm disabled:cursor-not-allowed"
      >
        <Heart className="size-3.5" />
      </button>
      <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
        <p className="line-clamp-1 text-sm font-semibold">{cityName}</p>
        <p className="line-clamp-1 text-xs text-white/80">{countryName}</p>
        {fromPriceLabel && (
          <p className="text-[11px] font-semibold text-primary">{fromPriceLabel}</p>
        )}
      </div>
    </Link>
  );
}
