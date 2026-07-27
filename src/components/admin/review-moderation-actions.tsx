"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Admin");
  const [isPending, startTransition] = useTransition();

  function handle(status: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      await moderateReviewAction(locale, reviewId, status);
      toast.success(t("updated"));
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={isPending} onClick={() => handle("APPROVED")}>
        {t("approve")}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={() => handle("REJECTED")}
      >
        {t("reject")}
      </Button>
    </div>
  );
}
