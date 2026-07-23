"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resolveConflictAction } from "@/domains/channel-manager/actions";
import { useRouter } from "@/i18n/navigation";

export function ResolveChannelConflictButton({
  locale,
  organizationId,
  channelReservationImportId,
}: {
  locale: string;
  organizationId: string;
  channelReservationImportId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await resolveConflictAction(locale, organizationId, channelReservationImportId);
          router.refresh();
        })
      }
    >
      Mark reviewed
    </Button>
  );
}
