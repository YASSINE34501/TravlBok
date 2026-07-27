"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminSetRuleStatusAction } from "@/domains/dynamic-pricing/actions";
import { useRouter } from "@/i18n/navigation";

export function PricingRuleStatusButton({
  locale,
  ruleId,
  status,
}: {
  locale: string;
  ruleId: string;
  status: "APPROVED" | "REJECTED";
}) {
  const router = useRouter();
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    try {
      const result = await adminSetRuleStatusAction(locale, ruleId, status);
      if (!result.success) {
        toast.error(tCommon("somethingWentWrong"));
        return;
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button size="sm" variant="outline" disabled={isSubmitting} onClick={handleClick}>
      {status === "APPROVED" ? t("approve") : t("reject")}
    </Button>
  );
}
