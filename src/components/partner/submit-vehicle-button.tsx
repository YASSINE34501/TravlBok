"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { submitVehicleForApprovalAction } from "@/domains/vehicles/actions";

export function SubmitVehicleButton({
  locale,
  organizationId,
  vehicleId,
}: {
  locale: string;
  organizationId: string;
  vehicleId: string;
}) {
  const tCommon = useTranslations("Common");
  const tOnboarding = useTranslations("Onboarding");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const result = await submitVehicleForApprovalAction(locale, organizationId, vehicleId);
      if (result.success) {
        toast.success(tOnboarding("submittedForApproval"));
      } else {
        toast.error(tCommon("somethingWentWrong"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button size="lg" disabled={isSubmitting} onClick={handleSubmit}>
      {isSubmitting ? tCommon("loading") : tCommon("submitForApproval")}
    </Button>
  );
}
