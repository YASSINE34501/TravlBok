"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { markNotificationReadAction } from "@/domains/notifications/actions";
import { useRouter } from "@/i18n/navigation";

export function MarkNotificationReadButton({
  locale,
  notificationId,
}: {
  locale: string;
  notificationId: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    try {
      await markNotificationReadAction(locale, notificationId);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button size="sm" variant="ghost" disabled={isSubmitting} onClick={handleClick}>
      Mark read
    </Button>
  );
}
