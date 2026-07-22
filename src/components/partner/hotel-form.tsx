"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hotelSchema, type HotelInput } from "@/lib/validation/hotel";
import { createHotelAction, updateHotelAction } from "@/domains/hotels/actions";
import { useRouter } from "@/i18n/navigation";

type Option = { id: string; code?: string; name: string; countryId?: string };

const BOOLEAN_AMENITY_FIELDS = [
  "parking",
  "breakfast",
  "restaurant",
  "swimmingPool",
  "spa",
  "gym",
  "wifi",
  "airportShuttle",
] as const;

export function HotelForm({
  locale,
  organizationId,
  hotelId,
  defaultValues,
  categories,
  countries,
  cities,
  amenities,
}: {
  locale: string;
  organizationId: string;
  hotelId?: string;
  defaultValues: HotelInput;
  categories: Option[];
  countries: Option[];
  cities: Option[];
  amenities: Option[];
}) {
  const t = useTranslations("Partner");
  const tCommon = useTranslations("Common");
  const tSearch = useTranslations("Search");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<HotelInput>({
    resolver: zodResolver(hotelSchema),
    defaultValues,
  });

  const selectedCountryId = useWatch({ control: form.control, name: "countryId" });
  const availableCities = useMemo(
    () => cities.filter((city) => city.countryId === selectedCountryId),
    [cities, selectedCountryId]
  );

  const categoryItems = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const countryItems = Object.fromEntries(countries.map((c) => [c.id, c.name]));
  const cityItems = Object.fromEntries(availableCities.map((c) => [c.id, c.name]));
  const starItems = { "1": "★", "2": "★★", "3": "★★★", "4": "★★★★", "5": "★★★★★" };

  async function onSubmit(values: HotelInput) {
    setIsSubmitting(true);
    try {
      const result = hotelId
        ? await updateHotelAction(locale, organizationId, hotelId, values)
        : await createHotelAction(locale, organizationId, values);

      if (!result.success) {
        toast.error(tCommon("somethingWentWrong"));
        return;
      }

      toast.success(tCommon("success"));
      if (!hotelId) {
        router.push(`/dashboard/properties/${result.hotelId}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("propertyDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hotel name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Description</FormLabel>
              <Tabs defaultValue="en" className="mt-1">
                <TabsList>
                  <TabsTrigger value="en">EN</TabsTrigger>
                  <TabsTrigger value="fr">FR</TabsTrigger>
                  <TabsTrigger value="ar">AR</TabsTrigger>
                </TabsList>
                <TabsContent value="en">
                  <FormField
                    control={form.control}
                    name="descriptionEn"
                    render={({ field }) => (
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                    )}
                  />
                </TabsContent>
                <TabsContent value="fr">
                  <FormField
                    control={form.control}
                    name="descriptionFr"
                    render={({ field }) => (
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                    )}
                  />
                </TabsContent>
                <TabsContent value="ar">
                  <FormField
                    control={form.control}
                    name="descriptionAr"
                    render={({ field }) => (
                      <FormControl>
                        <Textarea rows={4} dir="rtl" {...field} />
                      </FormControl>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tSearch("propertyType")}</FormLabel>
                    <Select
                      items={categoryItems}
                      value={field.value}
                      onValueChange={(value) => value && field.onChange(value)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="starRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tSearch("stars")}</FormLabel>
                    <Select
                      items={starItems}
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(value) => value && field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <SelectItem key={star} value={String(star)}>
                            {"★".repeat(star)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("location")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="countryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select
                      items={countryItems}
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value ?? "");
                        form.setValue("cityId", "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <Select
                      items={cityItems}
                      value={field.value}
                      onValueChange={(value) => value && field.onChange(value)}
                      disabled={availableCities.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact & policies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input type="url" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="checkInTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-in time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="checkOutTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-out time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tSearch("amenities")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BOOLEAN_AMENITY_FIELDS.map((fieldName) => (
                <FormField
                  key={fieldName}
                  control={form.control}
                  name={fieldName}
                  render={({ field }) => (
                    <label className="flex items-center gap-2 text-sm capitalize">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                      {fieldName.replace(/([A-Z])/g, " $1").trim()}
                    </label>
                  )}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 border-t pt-4 sm:grid-cols-4">
              <FormField
                control={form.control}
                name="acceptsPayAtProperty"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                    Accepts pay at property
                  </label>
                )}
              />
              <FormField
                control={form.control}
                name="acceptsOnlinePayment"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                    Accepts online payment
                  </label>
                )}
              />
            </div>

            {amenities.length > 0 && (
              <FormField
                control={form.control}
                name="amenityIds"
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2 border-t pt-4 sm:grid-cols-4">
                    {amenities.map((amenity) => (
                      <label key={amenity.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.value.includes(amenity.id)}
                          onCheckedChange={(checked) =>
                            field.onChange(
                              checked
                                ? [...field.value, amenity.id]
                                : field.value.filter((id) => id !== amenity.id)
                            )
                          }
                        />
                        {amenity.name}
                      </label>
                    ))}
                  </div>
                )}
              />
            )}
          </CardContent>
        </Card>

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? tCommon("loading") : tCommon("save")}
        </Button>
      </form>
    </Form>
  );
}
