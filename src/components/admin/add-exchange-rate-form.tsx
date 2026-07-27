"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addExchangeRateAction } from "@/domains/admin/actions";
import { useRouter } from "@/i18n/navigation";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency/config";

const TARGET_CURRENCIES = CURRENCIES.filter((code) => code !== "MAD");
const TARGET_CURRENCY_ITEMS = Object.fromEntries(
  TARGET_CURRENCIES.map((code) => [code, code])
) as Record<Exclude<CurrencyCode, "MAD">, string>;

export function AddExchangeRateForm({ locale }: { locale: string }) {
  const router = useRouter();
  const t = useTranslations("Admin");
  const [currency, setCurrency] = useState<Exclude<CurrencyCode, "MAD">>("EUR");
  const [rate, setRate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!rate) return;
    setIsSubmitting(true);
    try {
      await addExchangeRateAction(locale, currency, Number(rate));
      toast.success(t("rateAdded"));
      setRate("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-end gap-2">
      <div>
        <Select
          items={TARGET_CURRENCY_ITEMS}
          value={currency}
          onValueChange={(v) => v && setCurrency(v as Exclude<CurrencyCode, "MAD">)}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TARGET_CURRENCIES.map((code) => (
              <SelectItem key={code} value={code}>
                {code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        type="number"
        step="0.0001"
        placeholder={t("rateInMadPerUnit")}
        value={rate}
        onChange={(e) => setRate(e.target.value)}
        className="w-48"
      />
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        {t("addRate")}
      </Button>
    </div>
  );
}
