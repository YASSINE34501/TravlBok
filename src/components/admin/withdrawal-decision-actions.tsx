"use client";

import { useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  function run(decision: "APPROVED" | "REJECTED" | "PAID") {
    startTransition(async () => {
      await processWithdrawalAction(locale, withdrawalId, decision);
      toast.success("Updated");
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      {status === "REQUESTED" && (
        <>
          <Button size="sm" disabled={isPending} onClick={() => run("APPROVED")}>
            Approve
          </Button>
          <Button size="sm" variant="destructive" disabled={isPending} onClick={() => run("REJECTED")}>
            Reject
          </Button>
        </>
      )}
      {status === "APPROVED" && (
        <Button size="sm" disabled={isPending} onClick={() => run("PAID")}>
          Mark paid
        </Button>
      )}
    </div>
  );
}
