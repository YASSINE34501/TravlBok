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

/**
 * Featured-hotels sizing, keyed by how many cards there actually are.
 *
 * A hard-wired 4-column grid only looks right when four hotels exist. With
 * the two currently published, it left two dead cells and a large gap on the
 * right. Fewer cards therefore get fewer columns plus a centred max-width, so
 * the row stays balanced and the cards keep sane proportions instead of each
 * stretching to half the viewport.
 *
 * Full literal class strings — Tailwind scans source text, so these can never
 * be built by concatenation.
 */
const FEATURED_HOTEL_MAX_WIDTH: Record<number, string> = {
  1: "max-w-sm",
  2: "max-w-3xl",
  3: "max-w-5xl",
  4: "max-w-none",
};

const FEATURED_HOTEL_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
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
    // One full desktop row. Anything beyond the first four lives behind
    // "View all hotels" rather than starting a ragged second row.
    getFeaturedHotels(4),
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
            className="object-cover object-center"
          />
          {/*
            Readability wash for the text column. CSS gradients only take
            physical directions, so `rtl:-scale-x-100` mirrors the whole
            overlay instead: in Arabic the text block flips to the right and
            the wash flips with it. Anchoring this to the photo's fixed
            composition instead (the previous approach) left the entire
            Arabic headline sitting on the unmasked sunlit cliff — the photo
            itself is deliberately NOT mirrored, only this overlay.
            Solid behind the copy, clear by ~78% so the photo still reads.
          */}
          <div
            className="absolute inset-0 hidden lg:block rtl:-scale-x-100"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--background) 0%, var(--background) 26%, color-mix(in oklch, var(--background) 48%, transparent) 48%, color-mix(in oklch, var(--background) 10%, transparent) 66%, transparent 78%)",
            }}
          />
          {/*
            Below lg the text column spans nearly the full frame, so the
            desktop gradient (clear by 78%) leaves the paragraph and the third
            trust badge sitting on bare photo. This wash covers much more of
            the width — the photo stays visible on the far side, but no copy
            ever lands on an unmasked highlight.
          */}
          <div
            className="absolute inset-0 lg:hidden rtl:-scale-x-100"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--background) 0%, color-mix(in oklch, var(--background) 90%, transparent) 58%, color-mix(in oklch, var(--background) 58%, transparent) 82%, color-mix(in oklch, var(--background) 32%, transparent) 100%)",
            }}
          />
          {/* Holds contrast for the white destinations heading over the bright sky. */}
          <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-transparent" />
          {/* Settles the photo into the page background so the search card sits on a calm base. */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-background via-background/45 to-transparent" />
          {/* Soft vignette — premium lighting falloff at the frame edges. */}
          <div className="absolute inset-0 shadow-[inset_0_0_160px_50px_color-mix(in_oklch,var(--foreground)_16%,transparent)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-32 sm:px-6 sm:pt-20 sm:pb-40 lg:pt-24 lg:pb-44">
          <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-10">
            <div className="text-start lg:col-span-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-card/90 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm [&>svg]:text-primary">
                <ShieldCheck className="size-3.5" />
                {t("heroBadge")}
              </span>
              <h1 className="mt-6 text-[2.6rem] leading-[1.03] font-bold tracking-[-0.02em] text-balance text-foreground sm:text-6xl lg:text-[4rem]">
                {t("heroTitle")}
                <br />
                {t("heroTitleLine2")} <span className="text-primary">{t("heroTitleHighlight")}</span>.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {t("heroSubtitle")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                {[t("heroBadge"), t("heroCheckSupport"), t("heroCheckCancellation")].map((label) => (
                  <span
                    key={label}
                    className="flex items-center gap-2 text-sm font-medium text-foreground"
                  >
                    <CheckCircle2 className="size-4.5 shrink-0 text-primary" strokeWidth={2} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {destinationCards.length > 0 && (
              <div className="hidden gap-5 lg:col-span-6 lg:mt-2 lg:flex">
                <div className="flex w-44 shrink-0 flex-col justify-between rounded-3xl border border-white/60 bg-card/85 p-5 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.1em] text-primary uppercase">
                      <Crown className="size-3.5" />
                      {t("memberExclusiveTitle")}
                    </span>
                    <p className="mt-3 text-[15px] leading-snug font-semibold tracking-tight text-foreground">
                      {t("memberExclusiveDescription")}
                    </p>
                  </div>
                  <Button
                    className="mt-5 w-full justify-between rounded-xl font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    render={<Link href="/register" />}
                  >
                    {t("memberExclusiveCta")}
                    <ArrowUpRight className="size-4 rtl:-scale-x-100" />
                  </Button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="min-w-0 truncate text-lg font-bold tracking-tight text-white drop-shadow-md">
                      {t("popularDestinations")}
                    </h2>
                    <Link
                      href="/destinations"
                      className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-white/90 drop-shadow-md transition-colors hover:text-primary"
                    >
                      {t("viewAllDestinations")}
                      <ArrowRight className="size-3 rtl:rotate-180" />
                    </Link>
                  </div>
                  <Carousel className="mt-4">
                    <CarouselContent className="-ms-3">
                      {destinationCards.map((d) => (
                        <CarouselItem key={d.id} className="basis-1/2 ps-3 xl:basis-1/3">
                          <DestinationTile {...d} />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselNext
                      aria-label={tCommon("next")}
                      className="end-0 size-9 border-none bg-background/95 shadow-lg transition-transform hover:scale-105"
                    />
                  </Carousel>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-28 max-w-7xl px-4 sm:-mt-32 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-card/90 shadow-2xl ring-1 ring-black/5 backdrop-blur-2xl">
          <HeroSearch />
          <div className="border-t border-border/60 bg-background/40 px-5 py-5 sm:px-7 sm:py-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {trustBarPrimary.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Icon className="size-4.5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {destinationCards.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:hidden">
          <h2 className="text-3xl font-bold tracking-tight">{t("popularDestinations")}</h2>
          <Carousel className="mt-8">
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
        <section className="bg-muted/30 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                {t("exclusiveDeals")}
              </h2>
              <Button
                variant="ghost"
                className="shrink-0 gap-1.5 font-semibold text-primary hover:bg-primary/10"
                render={<Link href="/deals" />}
              >
                {t("viewAllDeals")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Button>
            </div>
            <Carousel className="mt-10">
              <CarouselContent className="-ms-5">
                {deals.map((hotel) => (
                  <CarouselItem key={hotel.id} className="basis-4/5 ps-5 sm:basis-1/2 lg:basis-1/4">
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
        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            {/*
              Header and grid share one width-capped wrapper so the title always
              lines up with the first card's left edge. With fewer than four
              hotels the block narrows and centres as a unit — centring only the
              grid would leave the heading stranded against the page margin.
            */}
            <div
              className={`mx-auto ${
                FEATURED_HOTEL_MAX_WIDTH[featuredHotels.length] ?? FEATURED_HOTEL_MAX_WIDTH[4]
              }`}
            >
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                  {t("featuredHotels")}
                </h2>
                <Button
                  variant="ghost"
                  className="-ms-4 shrink-0 gap-1.5 font-semibold text-primary hover:bg-primary/10 sm:ms-0"
                  render={<Link href="/hotels" />}
                >
                  {t("viewAllHotels")}
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Button>
              </div>
              {/*
                `items-stretch` (the grid default) only equalises heights because
                every card carries `h-full` down to its `Card` — see the note in
                `HotelCard`.
              */}
              <div
                className={`mt-12 grid auto-rows-fr gap-6 ${
                  FEATURED_HOTEL_COLS[featuredHotels.length] ?? FEATURED_HOTEL_COLS[4]
                }`}
              >
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
          </div>
        </section>
      )}

      {featuredVehicles.length > 0 && (
        <section className="bg-muted/30 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                {t("featuredVehicles")}
              </h2>
              <Button
                variant="ghost"
                className="shrink-0 gap-1.5 text-primary hover:bg-primary/10"
                render={<Link href="/cars" />}
              >
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      {/*
        Stands in for the brief's "Trusted Partners" logo wall: TravlBok has no
        live Booking/Agoda/Expedia/Viator integration (every Channel Manager
        provider is a sandbox mock), so third-party logos would assert
        partnerships that don't exist. Own-branding trust indicators instead,
        per the user's ruling — logos get added per-provider as each real
        integration ships.
      */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {t("whyChooseTitle")}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trustBarSecondary.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <Icon className="size-5.5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold tracking-tight text-foreground">
                    {title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 sm:px-6">
          <Card className="rounded-3xl border-border/60 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-10">
            <CardContent className="p-0">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <Handshake className="size-5.5" />
              </span>
              <h3 className="mt-5 text-2xl font-bold tracking-tight">{t("partnerCta")}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {t("partnerCtaDescription")}
              </p>
              <Button
                className="mt-6 rounded-xl font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                render={<Link href="/become-a-partner" />}
              >
                {t("partnerCtaButton")}
              </Button>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-border/60 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-10">
            <CardContent className="p-0">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-foreground/8 text-foreground">
                <Link2 className="size-5.5" />
              </span>
              <h3 className="mt-5 text-2xl font-bold tracking-tight">{t("affiliateCta")}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {t("affiliateCtaDescription")}
              </p>
              <Button
                variant="secondary"
                className="mt-6 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
      className="group relative block aspect-2/3 overflow-hidden rounded-2xl bg-muted shadow-lg ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
    >
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 1024px) 200px, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.08]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
          <MapPin className="size-6" />
        </div>
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent"
      />
      <button
        type="button"
        disabled
        aria-label={cityName}
        title={cityName}
        className="absolute end-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/25 text-white ring-1 ring-white/25 backdrop-blur-md disabled:cursor-not-allowed"
      >
        <Heart className="size-3.5" />
      </button>
      {/*
        Sized to survive the longest label this renders, not the shortest: the
        reference's "From $105" is far narrower than a formatted MAD amount
        ("From MAD 850.00"), which truncated to "From…" at the reference's own
        card width. Tight type + minimal padding keeps three cards per row.
      */}
      <div className="absolute inset-x-0 bottom-0 space-y-0.5 p-2 text-white">
        <p className="line-clamp-1 text-[13px] font-bold tracking-tight">{cityName}</p>
        <p className="line-clamp-1 text-[11px] text-white/75">{countryName}</p>
        {fromPriceLabel && (
          <p className="line-clamp-1 pt-0.5 text-[10px] font-semibold text-primary">
            {fromPriceLabel}
          </p>
        )}
      </div>
    </Link>
  );
}
