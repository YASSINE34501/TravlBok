"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
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
import { BED_TYPE_OPTIONS, roomSchema, type RoomInput } from "@/lib/validation/room";
import { createRoomAction, updateRoomAction } from "@/domains/rooms/actions";
import { useRouter } from "@/i18n/navigation";
import { CURRENCY_SELECT_ITEMS } from "@/lib/currency/config";

const BOOLEAN_FIELDS = [
  "smokingAllowed",
  "accessible",
  "breakfastIncluded",
  "refundable",
  "instantBooking",
] as const;

export function RoomForm({
  locale,
  organizationId,
  hotelId,
  roomId,
  defaultValues,
  amenities,
}: {
  locale: string;
  organizationId: string;
  hotelId: string;
  roomId?: string;
  defaultValues: RoomInput;
  amenities: { id: string; name: string }[];
}) {
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RoomInput>({
    resolver: zodResolver(roomSchema),
    defaultValues,
  });

  async function onSubmit(values: RoomInput) {
    setIsSubmitting(true);
    try {
      const result = roomId
        ? await updateRoomAction(locale, organizationId, hotelId, roomId, values)
        : await createRoomAction(locale, organizationId, hotelId, values);

      if (!result.success) {
        toast.error(tCommon("somethingWentWrong"));
        return;
      }
      toast.success(tCommon("success"));
      if (!roomId) {
        router.push(`/dashboard/properties/${hotelId}/rooms/${result.roomId}`);
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
            <CardTitle>Room details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roomTypeLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room type</FormLabel>
                    <FormControl>
                      <Input placeholder="Standard, Deluxe, Suite…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                        <Textarea rows={3} {...field} />
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
                        <Textarea rows={3} {...field} />
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
                        <Textarea rows={3} dir="rtl" {...field} />
                      </FormControl>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {(
                [
                  ["maxGuests", "Max guests"],
                  ["maxAdults", "Adults"],
                  ["maxChildren", "Children"],
                  ["numberOfBeds", "Beds"],
                  ["bathrooms", "Bathrooms"],
                ] as const
              ).map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormField
              control={form.control}
              name="roomSizeSqm"
              render={({ field }) => (
                <FormItem className="max-w-40">
                  <FormLabel>Size (m²)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bedTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bed types</FormLabel>
                  <div className="flex flex-wrap gap-3">
                    {BED_TYPE_OPTIONS.map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.value.includes(option)}
                          onCheckedChange={(checked) =>
                            field.onChange(
                              checked
                                ? [...field.value, option]
                                : field.value.filter((v) => v !== option)
                            )
                          }
                        />
                        {option.replace("_", " ")}
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weekendPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekend price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      items={CURRENCY_SELECT_ITEMS}
                      value={field.value}
                      onValueChange={(value) => value && field.onChange(value)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MAD">MAD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxRatePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax %</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cleaningFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cleaning fee</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="availableQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minStay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min stay (nights)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxStay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max stay (nights)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {BOOLEAN_FIELDS.map((fieldName) => (
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
          </CardContent>
        </Card>

        {amenities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="amenityIds"
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
            </CardContent>
          </Card>
        )}

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? tCommon("loading") : tCommon("save")}
        </Button>
      </form>
    </Form>
  );
}
