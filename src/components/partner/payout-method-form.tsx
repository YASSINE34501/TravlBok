"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updatePayoutMethodAction } from "@/domains/affiliates/actions";
import { useRouter } from "@/i18n/navigation";

export function PayoutMethodForm({
  locale,
  organizationId,
  initialType,
  initialDetails,
}: {
  locale: string;
  organizationId: string;
  initialType: "BANK_TRANSFER" | "PAYPAL";
  initialDetails: string;
}) {
  const t = useTranslations("Partner");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [type, setType] = useState<"BANK_TRANSFER" | "PAYPAL">(initialType);
  const [details, setDetails] = useState(initialDetails);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await updatePayoutMethodAction(locale, organizationId, { type, details });
      toast.success(tCommon("success"));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Select
        items={{ BANK_TRANSFER: "Bank transfer", PAYPAL: "PayPal" }}
        value={type}
        onValueChange={(v) => v && setType(v as typeof type)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
          <SelectItem value="PAYPAL">PayPal</SelectItem>
        </SelectContent>
      </Select>
      <Input
        placeholder={type === "PAYPAL" ? "PayPal email" : "IBAN / account details"}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        className="sm:col-span-2"
      />
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        {t("payoutMethod")}
      </Button>
    </div>
  );
}
