"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { approveCommissionAction, rejectCommissionAction } from "@/domains/affiliates/actions";
import { useRouter } from "@/i18n/navigation";

export function CommissionDecisionActions({
  locale,
  commissionId,
}: {
  locale: string;
  commissionId: string;
}) {
  const router = useRouter();
  const t = useTranslations("Admin");
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await approveCommissionAction(locale, commissionId);
            toast.success(t("approved"));
            router.refresh();
          })
        }
      >
        {t("approve")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button size="sm" variant="destructive" />}>{t("reject")}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rejectCommission")}</DialogTitle>
          </DialogHeader>
          <Textarea placeholder={t("rejectReason")} value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button
              disabled={!reason || isPending}
              onClick={() =>
                startTransition(async () => {
                  await rejectCommissionAction(locale, commissionId, reason);
                  setOpen(false);
                  router.refresh();
                })
              }
            >
              {t("confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
