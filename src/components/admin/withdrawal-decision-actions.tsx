"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { processWithdrawalAction } from "@/domains/affiliates/actions";
import { useRouter } from "@/i18n/navigation";

export function WithdrawalDecisionActions({
  locale,
  withdrawalId,
  status,
}: {
  locale: string;
  withdrawalId: string;
  status: string;
}) {
  const router = useRouter();
  const t = useTranslations("Admin");
  const [isPending, startTransition] = useTransition();

  function run(decision: "APPROVED" | "REJECTED" | "PAID") {
    startTransition(async () => {
      await processWithdrawalAction(locale, withdrawalId, decision);
      toast.success(t("updated"));
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      {status === "REQUESTED" && (
        <>
          <Button size="sm" disabled={isPending} onClick={() => run("APPROVED")}>
            {t("approve")}
          </Button>
          <Button size="sm" variant="destructive" disabled={isPending} onClick={() => run("REJECTED")}>
            {t("reject")}
          </Button>
        </>
      )}
      {status === "APPROVED" && (
        <Button size="sm" disabled={isPending} onClick={() => run("PAID")}>
          {t("markPaid")}
        </Button>
      )}
    </div>
  );
}
