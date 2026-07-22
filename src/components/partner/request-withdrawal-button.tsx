"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { requestWithdrawalAction } from "@/domains/affiliates/actions";
import { useRouter } from "@/i18n/navigation";

export function RequestWithdrawalButton({
  locale,
  organizationId,
}: {
  locale: string;
  organizationId: string;
}) {
  const t = useTranslations("Partner");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await requestWithdrawalAction(locale, organizationId);
          if (!result.success) {
            toast.error(tCommon("somethingWentWrong"));
            return;
          }
          toast.success(tCommon("success"));
          router.refresh();
        })
      }
    >
      {t("requestWithdrawal")}
    </Button>
  );
}
