"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { revokeApiKeyAction } from "@/domains/api-keys/actions";
import { useRouter } from "@/i18n/navigation";

export function RevokeApiKeyButton({
  locale,
  organizationId,
  apiKeyId,
}: {
  locale: string;
  organizationId: string;
  apiKeyId: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    try {
      const result = await revokeApiKeyAction(locale, organizationId, apiKeyId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button size="sm" variant="destructive" disabled={isSubmitting} onClick={handleClick}>
      Revoke
    </Button>
  );
}
