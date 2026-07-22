"use client";

import { useState, useTransition } from "react";
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
            toast.success("Approved");
            router.refresh();
          })
        }
      >
        Approve
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button size="sm" variant="destructive" />}>Reject</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject commission</DialogTitle>
          </DialogHeader>
          <Textarea placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
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
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
