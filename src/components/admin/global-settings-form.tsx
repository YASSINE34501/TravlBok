"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateGlobalSettingsAction } from "@/domains/admin/actions";
import { CURRENCY_SELECT_ITEMS } from "@/lib/currency/config";

export function GlobalSettingsForm({
  locale,
  initialValue,
}: {
  locale: string;
  initialValue: { defaultLocale: string; defaultCurrency: string; maintenanceMode: boolean };
}) {
  const t = useTranslations("Admin");
  const [defaultLocale, setDefaultLocale] = useState(initialValue.defaultLocale);
  const [defaultCurrency, setDefaultCurrency] = useState(initialValue.defaultCurrency);
  const [maintenanceMode, setMaintenanceMode] = useState(initialValue.maintenanceMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave() {
    setIsSubmitting(true);
    try {
      await updateGlobalSettingsAction(locale, {
        defaultLocale,
        defaultCurrency,
        maintenanceMode,
      });
      toast.success(t("saved"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <div>
        <p className="mb-1 text-sm font-medium">Default language</p>
        <Select
          items={{ en: "English", fr: "Français", ar: "العربية" }}
          value={defaultLocale}
          onValueChange={(v) => v && setDefaultLocale(v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
            <SelectItem value="ar">العربية</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium">Default currency</p>
        <Select
          items={CURRENCY_SELECT_ITEMS}
          value={defaultCurrency}
          onValueChange={(v) => v && setDefaultCurrency(v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MAD">MAD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={maintenanceMode}
          onCheckedChange={(c) => setMaintenanceMode(c === true)}
        />
        Maintenance mode
      </label>
      <Button disabled={isSubmitting} onClick={handleSave}>
        Save
      </Button>
    </div>
  );
}
