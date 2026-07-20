"use client";

import { useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await toggleCouponStatusAction(
        locale,
        couponId,
        status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      );
      toast.success("Updated");
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={isPending} onClick={handleClick}>
      {status === "ACTIVE" ? "Deactivate" : "Activate"}
    </Button>
  );
}
