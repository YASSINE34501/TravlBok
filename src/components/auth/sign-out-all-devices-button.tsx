"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signOutAllDevicesAction } from "@/domains/security/actions";

export function SignOutAllDevicesButton({ locale }: { locale: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    try {
      const result = await signOutAllDevicesAction(locale);
      if (!result.success) {
        toast.error("Something went wrong");
        return;
      }
      toast.success("Signed out of all devices");
      await signOut({ callbackUrl: `/${locale}/login` });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" disabled={isSubmitting} onClick={handleClick}>
      Sign out of all devices
    </Button>
  );
}
