"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resendVerificationAction } from "@/lib/auth/actions";

export function ResendVerificationForm({ locale }: { locale: string }) {
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleResend() {
    if (!email) return;
    setIsSubmitting(true);
    try {
      await resendVerificationAction(locale, email);
      toast.success(tCommon("success"));
    } catch {
      toast.error(tCommon("somethingWentWrong"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        type="email"
        placeholder={t("email")}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting || !email}
        onClick={handleResend}
      >
        {t("resendVerification")}
      </Button>
    </div>
  );
}
