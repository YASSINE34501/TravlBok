import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { MapPin, Fuel, Users, Cog, Briefcase } from "lucide-react";
import { getVehicleById } from "@/domains/vehicles/queries";
import { getDisplayCurrencyContext, formatFromBase } from "@/lib/currency/display";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; vehicleId: string }>;
}) {
  const { locale, vehicleId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Common");
  const tSearch = await getTranslations("Search");
  const tBooking = await getTranslations("Booking");

  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle) notFound();

  const { currency, rates } = await getDisplayCurrencyContext();
  const cityName = vehicle.branch.city
    ? pickLocaleText(vehicle.branch.city.name as Record<string, unknown>, locale)
    : null;
  const description = pickLocaleText(
    vehicle.description as Record<string, unknown>,
    locale
  );

  const specs = [
    { icon: Users, label: `${vehicle.seats} ${t("guests")}` },
    { icon: Cog, label: vehicle.transmission },
    { icon: Fuel, label: vehicle.fuel },
    { icon: Briefcase, label: vehicle.mileagePolicy },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold">
        {vehicle.brand} {vehicle.model} · {vehicle.year}
      </h1>
      {cityName && (
        <p className="mt-1 flex items-center gap-1 text-muted-foreground">
          <MapPin className="size-4" />
          {vehicle.branch.name}, {cityName}
        </p>
      )}

      {vehicle.media.length > 0 && (
        <div className="mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={vehicle.media[0].url}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="flex flex-col items-center gap-1.5 rounded-lg border p-4 text-center"
              >
                <spec.icon className="size-5 text-primary" />
                <span className="text-sm">{spec.label}</span>
              </div>
            ))}
          </section>

          {description && (
            <section>
              <h2 className="text-xl font-semibold">{t("viewDetails")}</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">
                {description}
              </p>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold">{tSearch("insurance")}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {vehicle.gpsAvailable && <Badge variant="secondary">GPS</Badge>}
              {vehicle.childSeatAvailable && (
                <Badge variant="secondary">Child seat</Badge>
              )}
              {vehicle.airportDeliveryAvailable && (
                <Badge variant="secondary">{tSearch("deliveryOption")}</Badge>
              )}
              {vehicle.mileagePolicy === "UNLIMITED" && (
                <Badge variant="secondary">{tSearch("unlimitedMileage")}</Badge>
              )}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-xl border p-6">
          <p className="text-2xl font-semibold">
            {formatFromBase(
              vehicle.pricePerDay.toString(),
              vehicle.currency,
              currency,
              rates,
              locale
            )}
            <span className="ms-1 text-sm font-normal text-muted-foreground">
              {t("perDay")}
            </span>
          </p>
          {vehicle.deposit && (
            <p className="mt-1 text-sm text-muted-foreground">
              Deposit:{" "}
              {formatFromBase(
                vehicle.deposit.toString(),
                vehicle.currency,
                currency,
                rates,
                locale
              )}
            </p>
          )}
          <Button
            className="mt-4 w-full"
            render={<Link href={`/cars/${vehicle.id}/book`} />}
          >
            {tBooking("confirmBooking")}
          </Button>
        </aside>
      </div>
    </main>
  );
}
