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
import { useRouter } from "@/i18n/navigation";

export function ApprovalActions({
  status,
  onApprove,
  onReject,
  onRequestChanges,
  onSuspend,
  onPublish,
  onUnpublish,
}: {
  status: string;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onRequestChanges: (notes: string) => Promise<void>;
  onSuspend?: () => Promise<void>;
  onPublish?: () => Promise<void>;
  onUnpublish?: () => Promise<void>;
}) {
  const router = useRouter();
  const t = useTranslations("Admin");
  const [isPending, startTransition] = useTransition();
  const [rejectReason, setRejectReason] = useState("");
  const [changeNotes, setChangeNotes] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      toast.success(t("updated"));
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING_REVIEW" && (
        <>
          <Button size="sm" disabled={isPending} onClick={() => run(onApprove)}>
            {t("approve")}
          </Button>
          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogTrigger render={<Button size="sm" variant="destructive" />}>
              {t("reject")}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("reject")}</DialogTitle>
              </DialogHeader>
              <Textarea
                placeholder={t("rejectReason")}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <DialogFooter>
                <Button
                  disabled={!rejectReason || isPending}
                  onClick={() => {
                    run(() => onReject(rejectReason));
                    setRejectOpen(false);
                  }}
                >
                  {t("confirmReject")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={changesOpen} onOpenChange={setChangesOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" />}>
              {t("requestChanges")}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("requestChanges")}</DialogTitle>
              </DialogHeader>
              <Textarea
                placeholder={t("whatNeedsToChange")}
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
              />
              <DialogFooter>
                <Button
                  disabled={!changeNotes || isPending}
                  onClick={() => {
                    run(() => onRequestChanges(changeNotes));
                    setChangesOpen(false);
                  }}
                >
                  {t("send")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {status === "APPROVED" && onPublish && (
        <Button size="sm" disabled={isPending} onClick={() => run(onPublish)}>
          {t("publish")}
        </Button>
      )}
      {status === "PUBLISHED" && onUnpublish && (
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(onUnpublish)}>
          {t("unpublish")}
        </Button>
      )}
      {onSuspend && status !== "SUSPENDED" && (
        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => run(onSuspend)}>
          {t("suspend")}
        </Button>
      )}
    </div>
  );
}
