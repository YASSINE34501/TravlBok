"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { confirmPaymentReceivedAction } from "@/domains/payments/actions";
import { useRouter } from "@/i18n/navigation";

export function ConfirmPaymentButton({
  locale,
  organizationId,
  paymentId,
}: {
  locale: string;
  organizationId: string;
  paymentId: string;
}) {
  const t = useTranslations("Payments");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await confirmPaymentReceivedAction(locale, organizationId, paymentId);
          if (!result.success) {
            toast.error(tCommon("somethingWentWrong"));
            return;
          }
          toast.success(tCommon("success"));
          router.refresh();
        })
      }
    >
      {t("confirmPayment")}
    </Button>
  );
}
