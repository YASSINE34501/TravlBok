"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { adminForceDisconnectChannelAction } from "@/domains/channel-manager/actions";
import { useRouter } from "@/i18n/navigation";

export function ForceDisconnectChannelButton({
  locale,
  connectionId,
}: {
  locale: string;
  connectionId: string;
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
          await adminForceDisconnectChannelAction(locale, connectionId);
          router.refresh();
        })
      }
    >
      Force disconnect
    </Button>
  );
}
