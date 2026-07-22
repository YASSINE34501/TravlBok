"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
    <div className="mx-auto max-w-4xl rounded-xl border bg-card p-4 text-start shadow-lg sm:p-6">
      <Tabs defaultValue="hotels">
        <TabsList>
          <TabsTrigger value="hotels">{tHome("searchHotels")}</TabsTrigger>
          <TabsTrigger value="cars">{tHome("searchCars")}</TabsTrigger>
        </TabsList>

        <TabsContent value="hotels">
          <form
            onSubmit={submitHotelSearch}
            className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-4"
          >
            <div className="sm:col-span-2">
              <Label htmlFor="hotel-destination">{t("destination")}</Label>
              <Input
                id="hotel-destination"
                placeholder={t("destinationPlaceholder")}
                value={hotelDestination}
                onChange={(e) => setHotelDestination(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="check-in">{t("checkIn")}</Label>
              <Input
                id="check-in"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="check-out">{t("checkOut")}</Label>
              <Input
                id="check-out"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="guests">{tCommon("guests")}</Label>
              <Input
                id="guests"
                type="number"
                min={1}
                max={20}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="rooms">{tCommon("rooms")}</Label>
              <Input
                id="rooms"
                type="number"
                min={1}
                max={10}
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <Button type="submit" size="lg" className="gap-2 sm:col-span-1 sm:self-end">
              <Search className="size-4" />
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
              <Input
                id="car-location"
                placeholder={t("destinationPlaceholder")}
                value={carLocation}
                onChange={(e) => setCarLocation(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="car-dropoff-location">{t("dropoffLocation")}</Label>
              <Input
                id="car-dropoff-location"
                placeholder={t("destinationPlaceholder")}
                value={carDropoffLocation}
                onChange={(e) => setCarDropoffLocation(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pickup-date">{t("pickupDate")}</Label>
              <Input
                id="pickup-date"
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="return-date">{t("returnDate")}</Label>
              <Input
                id="return-date"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button type="submit" size="lg" className="gap-2 sm:col-span-1 sm:self-end">
              <Search className="size-4" />
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
