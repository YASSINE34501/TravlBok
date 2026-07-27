"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signOutAllDevicesAction } from "@/domains/security/actions";

export function SignOutAllDevicesButton({ locale }: { locale: string }) {
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    try {
      const result = await signOutAllDevicesAction(locale);
      if (!result.success) {
        toast.error(tCommon("somethingWentWrong"));
        return;
      }
      toast.success(t("signedOutAllDevices"));
      await signOut({ callbackUrl: `/${locale}/login` });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" disabled={isSubmitting} onClick={handleClick}>
      {t("signOutAllDevices")}
    </Button>
  );
}
