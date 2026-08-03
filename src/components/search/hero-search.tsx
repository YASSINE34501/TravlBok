"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  BedDouble,
  Car,
  Plane,
  Tag,
  MapPin,
  CalendarDays,
  Users,
  Search,
  ArrowLeftRight,
  ChevronDown,
  Plus,
  Minus,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SearchFieldShell,
  SearchFieldLabel,
  SearchFieldRow,
  SEARCH_FIELD_INPUT_CLASS,
} from "@/components/search/search-field";
import { FlightCityCombobox, type SelectedCity } from "@/components/search/flight-city-combobox";

const TAB_TRIGGER_CLASS =
  "gap-2 px-1 pb-3 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground data-active:font-semibold data-active:text-primary [&_svg]:size-4.5";

const SUBMIT_BUTTON_CLASS =
  "h-auto min-h-14 gap-2 rounded-2xl px-8 text-base font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg lg:min-h-[4.5rem]";

export function HeroSearch() {
  const t = useTranslations("Search");
  const tHome = useTranslations("Home");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const [hotelDestination, setHotelDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);

  const [carLocation, setCarLocation] = useState("");
  const [carDropoffLocation, setCarDropoffLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const [flightOrigin, setFlightOrigin] = useState<SelectedCity | null>(null);
  const [flightDestination, setFlightDestination] = useState<SelectedCity | null>(null);
  const [departDate, setDepartDate] = useState("");
  const [flightReturnDate, setFlightReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState<"roundTrip" | "oneWay" | "multiCity">("roundTrip");

  function submitHotelSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (hotelDestination) params.set("destination", hotelDestination);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", String(guests));
    if (rooms) params.set("rooms", String(rooms));
    router.push(`/hotels?${params.toString()}`);
  }

  function submitCarSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (carLocation) params.set("location", carLocation);
    if (carDropoffLocation) params.set("dropoffLocation", carDropoffLocation);
    if (pickupDate) params.set("pickupDate", pickupDate);
    if (returnDate) params.set("returnDate", returnDate);
    router.push(`/cars?${params.toString()}`);
  }

  // TravlBok's own search form — the flight offers themselves come from
  // Travelpayouts (via searchExternalOffers on the /flights results page,
  // which redirects each offer through the tracked /go/flight route). The
  // affiliate provider is plumbing behind this page, never the UI surface.
  function submitFlightSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (flightOrigin) params.set("origin", flightOrigin.code);
    if (flightDestination) params.set("destination", flightDestination.code);
    if (departDate) params.set("departDate", departDate);
    if (tripType === "roundTrip" && flightReturnDate) {
      params.set("returnDate", flightReturnDate);
    }
    if (passengers) params.set("passengers", String(passengers));
    router.push(`/flights?${params.toString()}`);
  }

  return (
    <div className="p-5 text-start sm:p-7">
      <Tabs defaultValue="hotels">
        <TabsList
          variant="line"
          className="h-auto max-w-full flex-nowrap justify-start gap-7 overflow-x-auto border-b border-border/70 p-0 pb-0 sm:gap-9 [&_[data-slot=tabs-trigger]]:shrink-0 [&_[data-slot=tabs-trigger]]:after:bottom-[-1px] [&_[data-slot=tabs-trigger]]:after:h-[3px] [&_[data-slot=tabs-trigger]]:after:rounded-full [&_[data-slot=tabs-trigger]]:after:bg-primary"
        >
          <TabsTrigger value="hotels" className={TAB_TRIGGER_CLASS}>
            <BedDouble />
            {tHome("searchHotels")}
          </TabsTrigger>
          <TabsTrigger value="flights" className={TAB_TRIGGER_CLASS}>
            <Plane />
            {tHome("searchFlights")}
          </TabsTrigger>
          <TabsTrigger value="cars" className={TAB_TRIGGER_CLASS}>
            <Car />
            {tHome("searchCars")}
          </TabsTrigger>
          <TabsTrigger value="activities" className={TAB_TRIGGER_CLASS}>
            <Tag />
            {tHome("searchActivities")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hotels">
          <form
            onSubmit={submitHotelSearch}
            className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr_1.3fr_auto] lg:items-stretch"
          >
            <SearchFieldShell className="sm:col-span-2 lg:col-span-1">
              <SearchFieldLabel htmlFor="hotel-destination">{t("destination")}</SearchFieldLabel>
              <SearchFieldRow icon={MapPin}>
                <input
                  id="hotel-destination"
                  className={SEARCH_FIELD_INPUT_CLASS}
                  placeholder={t("destinationPlaceholder")}
                  value={hotelDestination}
                  onChange={(e) => setHotelDestination(e.target.value)}
                />
              </SearchFieldRow>
            </SearchFieldShell>
            <SearchFieldShell>
              <SearchFieldLabel htmlFor="check-in">{t("checkIn")}</SearchFieldLabel>
              <SearchFieldRow icon={CalendarDays}>
                <input
                  id="check-in"
                  type="date"
                  className={SEARCH_FIELD_INPUT_CLASS}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </SearchFieldRow>
            </SearchFieldShell>
            <SearchFieldShell>
              <SearchFieldLabel htmlFor="check-out">{t("checkOut")}</SearchFieldLabel>
              <SearchFieldRow icon={CalendarDays}>
                <input
                  id="check-out"
                  type="date"
                  className={SEARCH_FIELD_INPUT_CLASS}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </SearchFieldRow>
            </SearchFieldShell>
            <SearchFieldShell className="sm:col-span-2 lg:col-span-1">
              <SearchFieldLabel htmlFor="guests-rooms-trigger">
                {t("guestsAndRooms")}
              </SearchFieldLabel>
              <Popover>
                <PopoverTrigger
                  render={
                    <button
                      id="guests-rooms-trigger"
                      type="button"
                      className="mt-1 flex w-full items-center gap-2.5 text-start outline-none"
                    />
                  }
                >
                  <Users className="size-4.5 shrink-0 text-primary" strokeWidth={1.75} />
                  <span className="flex-1 text-sm font-medium">
                    {tCommon("guests")} {guests}, {tCommon("rooms")} {rooms}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </PopoverTrigger>
                <PopoverContent className="w-64 rounded-2xl" align="start">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{tCommon("guests")}</span>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={t("removeGuest")}
                        disabled={guests <= 1}
                        onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-4 text-center text-sm tabular-nums">{guests}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={t("addGuest")}
                        disabled={guests >= 20}
                        onClick={() => setGuests((g) => Math.min(20, g + 1))}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{tCommon("rooms")}</span>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={t("removeRoom")}
                        disabled={rooms <= 1}
                        onClick={() => setRooms((r) => Math.max(1, r - 1))}
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-4 text-center text-sm tabular-nums">{rooms}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={t("addRoom")}
                        disabled={rooms >= 10}
                        onClick={() => setRooms((r) => Math.min(10, r + 1))}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </SearchFieldShell>
            <Button type="submit" className={`${SUBMIT_BUTTON_CLASS} sm:col-span-2 lg:col-span-1`}>
              <Search className="size-5" />
              {tCommon("search")}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="flights">
          <div className="flex items-center gap-6 border-b border-border/70 pt-5 pb-3">
            {(["roundTrip", "oneWay", "multiCity"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTripType(type)}
                className={
                  "relative -mb-3 pb-3 text-sm font-medium transition-colors " +
                  (tripType === type
                    ? "font-semibold text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-primary"
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
            <p className="mt-3 text-xs text-muted-foreground">
              {t("multiCityComingSoon")}
            </p>
          )}
          <form
            onSubmit={submitFlightSearch}
            className="grid grid-cols-1 gap-3 pt-5 sm:grid-cols-6 lg:items-stretch"
          >
            <div className="relative flex items-stretch gap-2 sm:col-span-6 lg:col-span-2">
              <SearchFieldShell className="flex-1">
                <SearchFieldLabel htmlFor="flight-origin">{t("origin")}</SearchFieldLabel>
                <FlightCityCombobox
                  id="flight-origin"
                  icon={Plane}
                  bare
                  placeholder={t("originPlaceholder")}
                  selected={flightOrigin}
                  onSelectCity={setFlightOrigin}
                />
              </SearchFieldShell>
              <button
                type="button"
                aria-label={t("swapOriginDestination")}
                onClick={() => {
                  setFlightOrigin(flightDestination);
                  setFlightDestination(flightOrigin);
                }}
                className="my-auto flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:border-primary/45 hover:text-primary"
              >
                <ArrowLeftRight className="size-3.5" />
              </button>
              <SearchFieldShell className="flex-1">
                <SearchFieldLabel htmlFor="flight-destination">
                  {t("destination")}
                </SearchFieldLabel>
                <FlightCityCombobox
                  id="flight-destination"
                  icon={MapPin}
                  bare
                  placeholder={t("destinationPlaceholder")}
                  selected={flightDestination}
                  onSelectCity={setFlightDestination}
                />
              </SearchFieldShell>
            </div>
            <SearchFieldShell className="sm:col-span-3 lg:col-span-1">
              <SearchFieldLabel htmlFor="depart-date">{t("departDate")}</SearchFieldLabel>
              <SearchFieldRow icon={CalendarDays}>
                <input
                  id="depart-date"
                  type="date"
                  className={SEARCH_FIELD_INPUT_CLASS}
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                />
              </SearchFieldRow>
            </SearchFieldShell>
            {tripType === "roundTrip" && (
              <SearchFieldShell className="sm:col-span-3 lg:col-span-1">
                <SearchFieldLabel htmlFor="flight-return-date">
                  {t("returnDateOptional")}
                </SearchFieldLabel>
                <SearchFieldRow icon={CalendarDays}>
                  <input
                    id="flight-return-date"
                    type="date"
                    className={SEARCH_FIELD_INPUT_CLASS}
                    value={flightReturnDate}
                    onChange={(e) => setFlightReturnDate(e.target.value)}
                  />
                </SearchFieldRow>
              </SearchFieldShell>
            )}
            <SearchFieldShell
              className={tripType === "roundTrip" ? "sm:col-span-3 lg:col-span-1" : "sm:col-span-3 lg:col-span-2"}
            >
              <SearchFieldLabel htmlFor="passengers">{t("passengers")}</SearchFieldLabel>
              <SearchFieldRow icon={Users}>
                <input
                  id="passengers"
                  type="number"
                  min={1}
                  max={9}
                  className={SEARCH_FIELD_INPUT_CLASS}
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                />
              </SearchFieldRow>
            </SearchFieldShell>
            <Button type="submit" className={`${SUBMIT_BUTTON_CLASS} sm:col-span-3 lg:col-span-1`}>
              <Search className="size-5" />
              {tCommon("search")}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="cars">
          <form
            onSubmit={submitCarSearch}
            className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-stretch"
          >
            <SearchFieldShell>
              <SearchFieldLabel htmlFor="car-location">{t("pickupLocation")}</SearchFieldLabel>
              <SearchFieldRow icon={MapPin}>
                <input
                  id="car-location"
                  className={SEARCH_FIELD_INPUT_CLASS}
                  placeholder={t("destinationPlaceholder")}
                  value={carLocation}
                  onChange={(e) => setCarLocation(e.target.value)}
                />
              </SearchFieldRow>
            </SearchFieldShell>
            <SearchFieldShell>
              <SearchFieldLabel htmlFor="car-dropoff-location">
                {t("dropoffLocation")}
              </SearchFieldLabel>
              <SearchFieldRow icon={MapPin}>
                <input
                  id="car-dropoff-location"
                  className={SEARCH_FIELD_INPUT_CLASS}
                  placeholder={t("destinationPlaceholder")}
                  value={carDropoffLocation}
                  onChange={(e) => setCarDropoffLocation(e.target.value)}
                />
              </SearchFieldRow>
            </SearchFieldShell>
            <SearchFieldShell>
              <SearchFieldLabel htmlFor="pickup-date">{t("pickupDate")}</SearchFieldLabel>
              <SearchFieldRow icon={CalendarDays}>
                <input
                  id="pickup-date"
                  type="date"
                  className={SEARCH_FIELD_INPUT_CLASS}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </SearchFieldRow>
            </SearchFieldShell>
            <SearchFieldShell>
              <SearchFieldLabel htmlFor="return-date">{t("returnDate")}</SearchFieldLabel>
              <SearchFieldRow icon={CalendarDays}>
                <input
                  id="return-date"
                  type="date"
                  className={SEARCH_FIELD_INPUT_CLASS}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </SearchFieldRow>
            </SearchFieldShell>
            <Button type="submit" className={`${SUBMIT_BUTTON_CLASS} sm:col-span-2 lg:col-span-1`}>
              <Search className="size-5" />
              {tCommon("search")}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="activities">
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Tag className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">{tHome("activitiesComingSoon")}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
