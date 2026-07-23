"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  archivePricingRuleAction,
  approveRuleAction,
  rejectRuleAction,
  toggleRuleActiveAction,
} from "@/domains/dynamic-pricing/actions";
import { useRouter } from "@/i18n/navigation";

export function PricingRuleActions({
  locale,
  organizationId,
  ruleId,
  isActive,
  approvalStatus,
}: {
  locale: string;
  organizationId: string;
  ruleId: string;
  isActive: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setIsSubmitting(true);
    try {
      const result = await action();
      if (!result.success) {
        toast.error(result.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {approvalStatus === "PENDING" && (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => run(() => approveRuleAction(locale, organizationId, ruleId))}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => run(() => rejectRuleAction(locale, organizationId, ruleId))}
          >
            Reject
          </Button>
        </>
      )}
      {approvalStatus === "APPROVED" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => run(() => toggleRuleActiveAction(locale, organizationId, ruleId, !isActive))}
        >
          {isActive ? "Deactivate" : "Activate"}
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={isSubmitting}
        onClick={() => run(() => archivePricingRuleAction(locale, organizationId, ruleId))}
      >
        Archive
      </Button>
    </div>
  );
}
