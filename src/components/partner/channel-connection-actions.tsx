"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  disconnectChannelAction,
  updateAutoSyncAction,
  triggerPushSyncAction,
  triggerPullSyncAction,
} from "@/domains/channel-manager/actions";
import { useRouter } from "@/i18n/navigation";

export function ChannelConnectionActions({
  locale,
  organizationId,
  connectionId,
  autoSyncEnabled,
}: {
  locale: string;
  organizationId: string;
  connectionId: string;
  autoSyncEnabled: boolean;
}) {
  const router = useRouter();
  const tCommon = useTranslations("Common");
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; error?: string }>, successMessage?: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        toast.error(result.error ?? tCommon("error"));
        return;
      }
      if (successMessage) toast.success(successMessage);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        disabled={isPending}
        onClick={() =>
          run(() => triggerPushSyncAction(locale, organizationId, connectionId, "FULL"), "Sync pushed")
        }
      >
        Push availability/rates/restrictions
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => run(() => triggerPullSyncAction(locale, organizationId, connectionId), "Pull complete")}
      >
        Pull reservations
      </Button>
      <label className="flex items-center gap-2 text-sm">
        <Switch
          checked={autoSyncEnabled}
          onCheckedChange={(checked) =>
            run(() => updateAutoSyncAction(locale, organizationId, connectionId, checked === true))
          }
        />
        Auto sync
      </label>
      <Button
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={() => run(() => disconnectChannelAction(locale, organizationId, connectionId))}
      >
        Disconnect
      </Button>
    </div>
  );
}
