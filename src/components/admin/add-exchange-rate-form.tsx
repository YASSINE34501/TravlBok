"use client";

import { useState } from "react";
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

export function AddExchangeRateForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [currency, setCurrency] = useState<"EUR" | "USD">("EUR");
  const [rate, setRate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!rate) return;
    setIsSubmitting(true);
    try {
      await addExchangeRateAction(locale, currency, Number(rate));
      toast.success("Rate added");
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
          items={{ EUR: "EUR", USD: "USD" }}
          value={currency}
          onValueChange={(v) => v && setCurrency(v as "EUR" | "USD")}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Input
        type="number"
        step="0.0001"
        placeholder="Rate (MAD per unit)"
        value={rate}
        onChange={(e) => setRate(e.target.value)}
        className="w-48"
      />
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        Add rate
      </Button>
    </div>
  );
}
