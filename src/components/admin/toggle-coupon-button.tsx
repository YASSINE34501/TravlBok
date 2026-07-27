"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleCouponStatusAction } from "@/domains/admin/actions";
import { useRouter } from "@/i18n/navigation";

export function ToggleCouponButton({
  locale,
  couponId,
  status,
}: {
  locale: string;
  couponId: string;
  status: string;
}) {
  const router = useRouter();
  const t = useTranslations("Admin");
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await toggleCouponStatusAction(
        locale,
        couponId,
        status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      );
      toast.success(t("updated"));
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={isPending} onClick={handleClick}>
      {status === "ACTIVE" ? t("deactivate") : t("activate")}
    </Button>
  );
}
