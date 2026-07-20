"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { moderateReviewAction } from "@/domains/admin/actions";
import { useRouter } from "@/i18n/navigation";

export function ReviewModerationActions({
  locale,
  reviewId,
}: {
  locale: string;
  reviewId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handle(status: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      await moderateReviewAction(locale, reviewId, status);
      toast.success("Updated");
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={isPending} onClick={() => handle("APPROVED")}>
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={() => handle("REJECTED")}
      >
        Reject
      </Button>
    </div>
  );
}
