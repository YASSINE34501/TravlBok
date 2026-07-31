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
  ChevronDown,
  Plus,
  Minus,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { TravelpayoutsFlightWidget } from "@/components/marketplace/travelpayouts-flight-widget";

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

  return (
    <div className="p-4 text-start sm:p-6">
      <Tabs defaultValue="hotels">
        <TabsList
          variant="line"
          className="h-10 max-w-full flex-nowrap gap-4 overflow-x-auto border-b pb-0 [&_[data-slot=tabs-trigger]]:shrink-0 [&_[data-slot=tabs-trigger]]:after:bg-primary"
        >
          <TabsTrigger
            value="hotels"
            className="gap-1.5 px-1 text-muted-foreground data-active:text-primary"
          >
            <BedDouble className="size-4" />
            {tHome("searchHotels")}
          </TabsTrigger>
          <TabsTrigger
            value="flights"
            className="gap-1.5 px-1 text-muted-foreground data-active:text-primary"
          >
            <Plane className="size-4" />
            {tHome("searchFlights")}
          </TabsTrigger>
          <TabsTrigger
            value="cars"
            className="gap-1.5 px-1 text-muted-foreground data-active:text-primary"
          >
            <Car className="size-4" />
            {tHome("searchCars")}
          </TabsTrigger>
          <TabsTrigger
            value="activities"
            className="gap-1.5 px-1 text-muted-foreground data-active:text-primary"
          >
            <Tag className="size-4" />
            {tHome("searchActivities")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hotels">
          <form
            onSubmit={submitHotelSearch}
            className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-4"
          >
            <div className="sm:col-span-2">
              <Label htmlFor="hotel-destination" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("destination")}</Label>
              <InputGroup className="mt-1.5 h-10">
                <InputGroupAddon>
                  <MapPin className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="hotel-destination"
                  placeholder={t("destinationPlaceholder")}
                  value={hotelDestination}
                  onChange={(e) => setHotelDestination(e.target.value)}
                />
              </InputGroup>
            </div>
            <div>
              <Label htmlFor="check-in" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("checkIn")}</Label>
              <InputGroup className="mt-1.5 h-10">
                <InputGroupAddon>
                  <CalendarDays className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="check-in"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </InputGroup>
            </div>
            <div>
              <Label htmlFor="check-out" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("checkOut")}</Label>
              <InputGroup className="mt-1.5 h-10">
                <InputGroupAddon>
                  <CalendarDays className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="check-out"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="guests-rooms-trigger" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("guestsAndRooms")}</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <button
                      id="guests-rooms-trigger"
                      type="button"
                      className="mt-1.5 flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-start text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  }
                >
                  <Users className="size-4 text-muted-foreground" />
                  <span className="flex-1">
                    {tCommon("guests")} {guests}, {tCommon("rooms")} {rooms}
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </PopoverTrigger>
                <PopoverContent className="w-64" align="start">
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
            </div>
            <Button type="submit" size="lg" className="gap-2 sm:col-span-1 sm:self-end">
              <Search className="size-4" />
              {tCommon("search")}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="cars">
          <form
            onSubmit={submitCarSearch}
            className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-4"
          >
            <div>
              <Label htmlFor="car-location" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("pickupLocation")}</Label>
              <InputGroup className="mt-1.5 h-10">
                <InputGroupAddon>
                  <MapPin className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="car-location"
                  placeholder={t("destinationPlaceholder")}
                  value={carLocation}
                  onChange={(e) => setCarLocation(e.target.value)}
                />
              </InputGroup>
            </div>
            <div>
              <Label htmlFor="car-dropoff-location" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("dropoffLocation")}</Label>
              <InputGroup className="mt-1.5 h-10">
                <InputGroupAddon>
                  <MapPin className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="car-dropoff-location"
                  placeholder={t("destinationPlaceholder")}
                  value={carDropoffLocation}
                  onChange={(e) => setCarDropoffLocation(e.target.value)}
                />
              </InputGroup>
            </div>
            <div>
              <Label htmlFor="pickup-date" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("pickupDate")}</Label>
              <InputGroup className="mt-1.5 h-10">
                <InputGroupAddon>
                  <CalendarDays className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="pickup-date"
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </InputGroup>
            </div>
            <div>
              <Label htmlFor="return-date" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("returnDate")}</Label>
              <InputGroup className="mt-1.5 h-10">
                <InputGroupAddon>
                  <CalendarDays className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="return-date"
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </InputGroup>
            </div>
            <Button type="submit" size="lg" className="gap-2 sm:col-span-1 sm:self-end">
              <Search className="size-4" />
              {tCommon("search")}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="flights" keepMounted className="pt-4">
          <TravelpayoutsFlightWidget />
        </TabsContent>

        <TabsContent value="activities">
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Tag className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{tHome("activitiesComingSoon")}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
