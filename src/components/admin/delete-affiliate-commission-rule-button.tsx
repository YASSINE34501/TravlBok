"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { deleteAffiliateCommissionRuleAction } from "@/domains/affiliates/actions";
import { useRouter } from "@/i18n/navigation";

export function DeleteAffiliateCommissionRuleButton({
  locale,
  ruleId,
}: {
  locale: string;
  ruleId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteAffiliateCommissionRuleAction(locale, ruleId);
          router.refresh();
        })
      }
    >
      <X className="size-3.5" />
    </button>
  );
}
