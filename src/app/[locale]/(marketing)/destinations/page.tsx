import { setRequestLocale, getTranslations } from "next-intl/server";
import { MapPin } from "lucide-react";
import { getPopularDestinations } from "@/domains/hotels/queries";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";

export default async function DestinationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  const destinations = await getPopularDestinations(24);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold">{t("popularDestinations")}</h1>

      {destinations.length === 0 ? (
        <div className="mt-8">
          <EmptyState />
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
              >
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
                    <MapPin className="size-6 text-primary" />
                    <p className="font-medium">{cityName}</p>
                    <p className="text-sm text-muted-foreground">{hotelCount}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
