"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { suspendSubscriptionAction } from "@/domains/subscriptions/actions";
import { useRouter } from "@/i18n/navigation";

export function SuspendSubscriptionButton({
  locale,
  organizationId,
}: {
  locale: string;
  organizationId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="destructive"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await suspendSubscriptionAction(locale, organizationId);
          router.refresh();
        })
      }
    >
      Suspend
    </Button>
  );
}
