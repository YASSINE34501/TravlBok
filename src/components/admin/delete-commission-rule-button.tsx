"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { deleteCommissionRuleAction } from "@/domains/admin/actions";
import { useRouter } from "@/i18n/navigation";

export function DeleteCommissionRuleButton({
  locale,
  commissionRuleId,
}: {
  locale: string;
  commissionRuleId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteCommissionRuleAction(locale, commissionRuleId);
          router.refresh();
        })
      }
    >
      <X className="size-3.5" />
    </button>
  );
}
