"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BedDouble, Car, MapPin, CalendarDays, Users, Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

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
    <div className="mx-auto max-w-4xl rounded-2xl border bg-card p-4 text-start shadow-xl ring-1 ring-black/5 sm:p-6">
      <Tabs defaultValue="hotels">
        <TabsList className="h-10 p-1">
          <TabsTrigger value="hotels" className="gap-1.5 px-3 text-muted-foreground">
            <BedDouble className="size-4" />
            {tHome("searchHotels")}
          </TabsTrigger>
          <TabsTrigger value="cars" className="gap-1.5 px-3 text-muted-foreground">
            <Car className="size-4" />
            {tHome("searchCars")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hotels">
          <form
            onSubmit={submitHotelSearch}
            className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-4"
          >
            <div className="sm:col-span-2">
              <Label htmlFor="hotel-destination">{t("destination")}</Label>
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
              <Label htmlFor="check-in">{t("checkIn")}</Label>
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
              <Label htmlFor="check-out">{t("checkOut")}</Label>
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
            <div className="sm:col-span-2">
              <Label htmlFor="guests">{tCommon("guests")}</Label>
              <InputGroup className="mt-1.5 h-10">
                <InputGroupAddon>
                  <Users className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="guests"
                  type="number"
                  min={1}
                  max={20}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                />
              </InputGroup>
            </div>
            <div>
              <Label htmlFor="rooms">{tCommon("rooms")}</Label>
              <InputGroup className="mt-1.5 h-10">
                <InputGroupInput
                  id="rooms"
                  type="number"
                  min={1}
                  max={10}
                  value={rooms}
                  onChange={(e) => setRooms(Number(e.target.value))}
                />
              </InputGroup>
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
              <Label htmlFor="car-location">{t("pickupLocation")}</Label>
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
              <Label htmlFor="car-dropoff-location">{t("dropoffLocation")}</Label>
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
              <Label htmlFor="pickup-date">{t("pickupDate")}</Label>
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
              <Label htmlFor="return-date">{t("returnDate")}</Label>
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
      </Tabs>
    </div>
  );
}
