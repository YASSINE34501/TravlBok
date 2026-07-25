"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { resolveMaintenanceIssueAction } from "@/domains/housekeeping/actions";
import { useRouter } from "@/i18n/navigation";

export function ResolveMaintenanceButton({
  locale,
  organizationId,
  taskId,
}: {
  locale: string;
  organizationId: string;
  taskId: string;
}) {
  const router = useRouter();
  const t = useTranslations("Pms");
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await resolveMaintenanceIssueAction(locale, organizationId, taskId);
          router.refresh();
        })
      }
    >
      {t("resolve")}
    </Button>
  );
}
