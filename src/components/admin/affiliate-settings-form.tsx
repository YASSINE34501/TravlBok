"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateAffiliateSettingsAction } from "@/domains/affiliates/actions";
import { useRouter } from "@/i18n/navigation";
import type { AffiliateSettings } from "@/domains/affiliates/rate";

export function AffiliateSettingsForm({
  locale,
  settings,
}: {
  locale: string;
  settings: AffiliateSettings;
}) {
  const router = useRouter();
  const [minimumWithdrawal, setMinimumWithdrawal] = useState(String(settings.minimumWithdrawal));
  const [holdingPeriodDays, setHoldingPeriodDays] = useState(String(settings.holdingPeriodDays));
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await updateAffiliateSettingsAction(locale, {
        minimumWithdrawal: Number(minimumWithdrawal),
        holdingPeriodDays: Number(holdingPeriodDays),
        payoutMethods: settings.payoutMethods,
      });
      toast.success("Saved");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <div>
        <label className="text-sm text-muted-foreground">Minimum withdrawal (MAD)</label>
        <Input
          type="number"
          value={minimumWithdrawal}
          onChange={(e) => setMinimumWithdrawal(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm text-muted-foreground">Holding period (days)</label>
        <Input
          type="number"
          value={holdingPeriodDays}
          onChange={(e) => setHoldingPeriodDays(e.target.value)}
        />
      </div>
      <Button disabled={isSubmitting} onClick={handleSubmit} className="self-end">
        Save
      </Button>
    </div>
  );
}
