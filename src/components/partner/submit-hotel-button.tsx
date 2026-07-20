"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { submitHotelForApprovalAction } from "@/domains/hotels/actions";

export function SubmitHotelButton({
  locale,
  organizationId,
  hotelId,
}: {
  locale: string;
  organizationId: string;
  hotelId: string;
}) {
  const tCommon = useTranslations("Common");
  const tOnboarding = useTranslations("Onboarding");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const result = await submitHotelForApprovalAction(locale, organizationId, hotelId);
      if (result.success) {
        toast.success(tOnboarding("submittedForApproval"));
      } else if (result.error === "roomRequired") {
        toast.error(tOnboarding("roomRequiredError"));
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
