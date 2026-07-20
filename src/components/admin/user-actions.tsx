"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

export function UserActions({
  status,
  onSuspend,
  onActivate,
}: {
  status: string;
  onSuspend: () => Promise<void>;
  onActivate: () => Promise<void>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      toast.success("Updated");
      router.refresh();
    });
  }

  if (status === "SUSPENDED") {
    return (
      <Button size="sm" disabled={isPending} onClick={() => run(onActivate)}>
        Activate
      </Button>
    );
  }

  return (
    <Button size="sm" variant="destructive" disabled={isPending} onClick={() => run(onSuspend)}>
      Suspend
    </Button>
  );
}
