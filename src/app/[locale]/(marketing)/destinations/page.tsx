import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { MapPin, Compass } from "lucide-react";
import { getPopularDestinations } from "@/domains/hotels/queries";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { buildLocaleAlternates } from "@/lib/seo/alternates";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("destinationsTitle"),
    description: t("destinationsDescription"),
    alternates: buildLocaleAlternates(locale, "/destinations"),
  };
}

export default async function DestinationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tCommon = await getTranslations("Common");

  const destinations = await getPopularDestinations(24);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t("popularDestinations")}</h1>

      {destinations.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={Compass} title={tCommon("noResults")} />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {destinations.map(({ city, hotelCount }) => {
            const cityName = pickLocaleText(
              city.name as Record<string, unknown>,
              locale
            );
            return (
              <Link
                key={city.id}
                href={`/hotels?destination=${encodeURIComponent(cityName)}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-primary/20"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <MapPin className="size-6" />
                </span>
                <p className="font-medium text-foreground">{cityName}</p>
                <p className="text-sm text-muted-foreground">{hotelCount}</p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
