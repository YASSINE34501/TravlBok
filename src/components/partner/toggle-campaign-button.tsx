"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleCampaignAction } from "@/domains/affiliates/actions";
import { useRouter } from "@/i18n/navigation";

export function ToggleCampaignButton({
  locale,
  organizationId,
  campaignId,
  isActive,
}: {
  locale: string;
  organizationId: string;
  campaignId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleCampaignAction(locale, organizationId, campaignId, !isActive);
          router.refresh();
        })
      }
    >
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
