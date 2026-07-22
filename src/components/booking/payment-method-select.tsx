"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PaymentProviderChoice =
  | "STRIPE"
  | "PAYPAL"
  | "BANK_TRANSFER"
  | "MANUAL"
  | "CASH_AT_PROPERTY";

export function PaymentMethodSelect({
  value,
  onChange,
}: {
  value: PaymentProviderChoice;
  onChange: (value: PaymentProviderChoice) => void;
}) {
  const t = useTranslations("Payments");

  const items: Record<PaymentProviderChoice, string> = {
    CASH_AT_PROPERTY: t("cashAtProperty"),
    STRIPE: t("card"),
    PAYPAL: t("paypal"),
    BANK_TRANSFER: t("bankTransfer"),
    MANUAL: t("manual"),
  };

  return (
    <div>
      <Label htmlFor="payment-method">{t("paymentMethod")}</Label>
      <Select
        items={items}
        value={value}
        onValueChange={(v) => v && onChange(v as PaymentProviderChoice)}
      >
        <SelectTrigger id="payment-method" className="mt-1 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(items).map(([code, label]) => (
            <SelectItem key={code} value={code}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
