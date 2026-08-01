"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plane, MapPin, CalendarDays, Users, Search, ArrowLeftRight } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { FlightCityCombobox, type SelectedCity } from "@/components/search/flight-city-combobox";

const FIELD_LABEL_CLASS = "text-xs font-semibold tracking-wide text-muted-foreground uppercase";

/**
 * The same flight search fields as HeroSearch's "flights" tab, extracted
 * standalone (no tab switcher) for the /flights landing page's own hero —
 * duplicated rather than sharing a component with HeroSearch so the
 * already-shipped homepage tabs stay untouched.
 */
export function FlightSearchForm({
  initialOrigin,
  initialDestination,
}: {
  initialOrigin?: SelectedCity | null;
  initialDestination?: SelectedCity | null;
}) {
  const t = useTranslations("Search");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const [origin, setOrigin] = useState<SelectedCity | null>(initialOrigin ?? null);
  const [destination, setDestination] = useState<SelectedCity | null>(initialDestination ?? null);
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState<"roundTrip" | "oneWay" | "multiCity">("roundTrip");

  function submitFlightSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set("origin", origin.code);
    if (destination) params.set("destination", destination.code);
    if (departDate) params.set("departDate", departDate);
    if (tripType === "roundTrip" && returnDate) {
      params.set("returnDate", returnDate);
    }
    if (passengers) params.set("passengers", String(passengers));
    router.push(`/flights?${params.toString()}`);
  }

  return (
    <div className="rounded-3xl border border-white/40 bg-white/90 p-4 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl sm:p-6 dark:border-white/10 dark:bg-card/90">
      <div className="flex items-center gap-4 border-b pb-3">
        {(["roundTrip", "oneWay", "multiCity"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTripType(type)}
            className={
              "relative -mb-3 pb-3 text-sm font-medium transition-colors " +
              (tripType === type
                ? "text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {t(
              type === "roundTrip"
                ? "tripTypeRoundTrip"
                : type === "oneWay"
                  ? "tripTypeOneWay"
                  : "tripTypeMultiCity"
            )}
          </button>
        ))}
      </div>
      {tripType === "multiCity" && (
        <p className="mt-2 text-xs text-muted-foreground">{t("multiCityComingSoon")}</p>
      )}
      <form onSubmit={submitFlightSearch} className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-6">
        <div className="relative flex items-end gap-2 sm:col-span-2">
          <div className="flex-1">
            <Label htmlFor="landing-flight-origin" className={FIELD_LABEL_CLASS}>
              {t("origin")}
            </Label>
            <FlightCityCombobox
              id="landing-flight-origin"
              icon={Plane}
              placeholder={t("originPlaceholder")}
              selected={origin}
              onSelectCity={setOrigin}
            />
          </div>
          <button
            type="button"
            aria-label={t("swapOriginDestination")}
            onClick={() => {
              setOrigin(destination);
              setDestination(origin);
            }}
            className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeftRight className="size-3.5" />
          </button>
          <div className="flex-1">
            <Label htmlFor="landing-flight-destination" className={FIELD_LABEL_CLASS}>
              {t("destination")}
            </Label>
            <FlightCityCombobox
              id="landing-flight-destination"
              icon={MapPin}
              placeholder={t("destinationPlaceholder")}
              selected={destination}
              onSelectCity={setDestination}
            />
          </div>
        </div>
        <div className="sm:col-span-1">
          <Label htmlFor="landing-depart-date" className={FIELD_LABEL_CLASS}>
            {t("departDate")}
          </Label>
          <InputGroup className="mt-1.5 h-10">
            <InputGroupAddon>
              <CalendarDays className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="landing-depart-date"
              type="date"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
            />
          </InputGroup>
        </div>
        {tripType === "roundTrip" && (
          <div className="sm:col-span-1">
            <Label htmlFor="landing-return-date" className={FIELD_LABEL_CLASS}>
              {t("returnDateOptional")}
            </Label>
            <InputGroup className="mt-1.5 h-10">
              <InputGroupAddon>
                <CalendarDays className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                id="landing-return-date"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </InputGroup>
          </div>
        )}
        <div className={tripType === "roundTrip" ? "sm:col-span-1" : "sm:col-span-2"}>
          <Label htmlFor="landing-passengers" className={FIELD_LABEL_CLASS}>
            {t("passengers")}
          </Label>
          <InputGroup className="mt-1.5 h-10">
            <InputGroupAddon>
              <Users className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="landing-passengers"
              type="number"
              min={1}
              max={9}
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
            />
          </InputGroup>
        </div>
        <Button type="submit" size="lg" className="gap-2 sm:col-span-1 sm:self-end">
          <Search className="size-4" />
          {tCommon("search")}
        </Button>
      </form>
    </div>
  );
}
