"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Admin");
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      toast.success(t("updated"));
      router.refresh();
    });
  }

  if (status === "SUSPENDED") {
    return (
      <Button size="sm" disabled={isPending} onClick={() => run(onActivate)}>
        {t("activate")}
      </Button>
    );
  }

  return (
    <Button size="sm" variant="destructive" disabled={isPending} onClick={() => run(onSuspend)}>
      {t("suspend")}
    </Button>
  );
}
