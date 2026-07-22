"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestRefundAction } from "@/domains/payments/actions";
import { useRouter } from "@/i18n/navigation";

export function RequestRefundButton({
  locale,
  organizationId,
  paymentId,
  maxAmount,
}: {
  locale: string;
  organizationId: string;
  paymentId: string;
  maxAmount: number;
}) {
  const t = useTranslations("Payments");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [amount, setAmount] = useState(String(maxAmount));
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        max={maxAmount}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-24"
      />
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await requestRefundAction(
              locale,
              organizationId,
              paymentId,
              Number(amount)
            );
            if (!result.success) {
              toast.error(tCommon("somethingWentWrong"));
              return;
            }
            toast.success(t("refundIssued"));
            router.refresh();
          })
        }
      >
        {t("refund")}
      </Button>
    </div>
  );
}
