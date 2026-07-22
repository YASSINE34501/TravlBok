"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  startCleaningAction,
  completeCleaningAction,
  requestInspectionAction,
  inspectRoomAction,
  reopenTaskAction,
} from "@/domains/housekeeping/actions";
import { useRouter } from "@/i18n/navigation";

export function HousekeepingTaskActions({
  locale,
  organizationId,
  taskId,
  status,
  canInspect,
}: {
  locale: string;
  organizationId: string;
  taskId: string;
  status: string;
  canInspect: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        toast.error(result.error ?? "Error");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      {status === "PENDING" && (
        <Button size="sm" disabled={isPending} onClick={() => run(() => startCleaningAction(locale, organizationId, taskId))}>
          Start
        </Button>
      )}
      {status === "IN_PROGRESS" && (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => run(() => completeCleaningAction(locale, organizationId, taskId))}
        >
          Complete
        </Button>
      )}
      {status === "COMPLETED" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run(() => requestInspectionAction(locale, organizationId, taskId))}
        >
          Request inspection
        </Button>
      )}
      {canInspect && status === "COMPLETED" && (
        <>
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => run(() => inspectRoomAction(locale, organizationId, taskId, true))}
          >
            Pass
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => run(() => inspectRoomAction(locale, organizationId, taskId, false))}
          >
            Fail
          </Button>
        </>
      )}
      {canInspect && status !== "PENDING" && status !== "IN_PROGRESS" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run(() => reopenTaskAction(locale, organizationId, taskId))}
        >
          Reopen
        </Button>
      )}
    </div>
  );
}
