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
  const [isPending, startTransition] = useTransition();
  const [rejectReason, setRejectReason] = useState("");
  const [changeNotes, setChangeNotes] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      toast.success("Updated");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING_REVIEW" && (
        <>
          <Button size="sm" disabled={isPending} onClick={() => run(onApprove)}>
            Approve
          </Button>
          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogTrigger render={<Button size="sm" variant="destructive" />}>
              Reject
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject</DialogTitle>
              </DialogHeader>
              <Textarea
                placeholder="Reason"
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
                  Confirm reject
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={changesOpen} onOpenChange={setChangesOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" />}>
              Request changes
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request changes</DialogTitle>
              </DialogHeader>
              <Textarea
                placeholder="What needs to change?"
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
                  Send
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {status === "APPROVED" && onPublish && (
        <Button size="sm" disabled={isPending} onClick={() => run(onPublish)}>
          Publish
        </Button>
      )}
      {status === "PUBLISHED" && onUnpublish && (
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(onUnpublish)}>
          Unpublish
        </Button>
      )}
      {onSuspend && status !== "SUSPENDED" && (
        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => run(onSuspend)}>
          Suspend
        </Button>
      )}
    </div>
  );
}
