"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { branchSchema, type BranchInput } from "@/lib/validation/branch";
import { createBranchAction, updateBranchAction } from "@/domains/branches/actions";
import { useRouter } from "@/i18n/navigation";

type Option = { id: string; name: string; countryId?: string };

export function BranchForm({
  locale,
  organizationId,
  branchId,
  defaultValues,
  countries,
  cities,
}: {
  locale: string;
  organizationId: string;
  branchId?: string;
  defaultValues: BranchInput;
  countries: Option[];
  cities: Option[];
}) {
  const t = useTranslations("Partner");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BranchInput>({
    resolver: zodResolver(branchSchema),
    defaultValues,
  });

  const selectedCountryId = useWatch({ control: form.control, name: "countryId" });
  const availableCities = useMemo(
    () => cities.filter((city) => city.countryId === selectedCountryId),
    [cities, selectedCountryId]
  );

  const countryItems = Object.fromEntries(countries.map((c) => [c.id, c.name]));
  const cityItems = Object.fromEntries(availableCities.map((c) => [c.id, c.name]));

  async function onSubmit(values: BranchInput) {
    setIsSubmitting(true);
    try {
      const result = branchId
        ? await updateBranchAction(locale, organizationId, branchId, values)
        : await createBranchAction(locale, organizationId, values);

      if (!result.success) {
        toast.error(tCommon("somethingWentWrong"));
        return;
      }
      toast.success(tCommon("success"));
      if (!branchId) {
        router.push(`/dashboard/branches/${result.branchId}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("branchDetails")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
            <FormField
              control={form.control}
              name="isMainBranch"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  Main branch
                </label>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tCommon("loading") : tCommon("save")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
