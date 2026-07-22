"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleSubscriptionPlanArchivedAction } from "@/domains/subscriptions/actions";
import { useRouter } from "@/i18n/navigation";

export function TogglePlanArchivedButton({
  locale,
  planId,
  isArchived,
}: {
  locale: string;
  planId: string;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleSubscriptionPlanArchivedAction(locale, planId, !isArchived);
          router.refresh();
        })
      }
    >
      {isArchived ? "Unarchive" : "Archive"}
    </Button>
  );
}
