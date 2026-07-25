"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { checkOutGuestAction } from "@/domains/pms/actions";
import { useRouter } from "@/i18n/navigation";

export function CheckOutDialog({
  locale,
  organizationId,
  checkInId,
  guestName,
}: {
  locale: string;
  organizationId: string;
  checkInId: string;
  guestName: string;
}) {
  const router = useRouter();
  const t = useTranslations("Pms");
  const [open, setOpen] = useState(false);
  const [extraChargesAmount, setExtraChargesAmount] = useState("0");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [roomConditionNotes, setRoomConditionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const result = await checkOutGuestAction(locale, organizationId, checkInId, {
        extraChargesAmount: Number(extraChargesAmount) || 0,
        discountAmount: Number(discountAmount) || 0,
        roomConditionNotes: roomConditionNotes || undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t("checkedOut"));
      setOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>{t("checkOut")}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("checkOutGuest", { guest: guestName })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            type="number"
            placeholder={t("extraCharges")}
            value={extraChargesAmount}
            onChange={(e) => setExtraChargesAmount(e.target.value)}
          />
          <Input
            type="number"
            placeholder={t("discount")}
            value={discountAmount}
            onChange={(e) => setDiscountAmount(e.target.value)}
          />
          <Textarea
            placeholder={t("roomConditionNotes")}
            value={roomConditionNotes}
            onChange={(e) => setRoomConditionNotes(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button disabled={isSubmitting} onClick={handleSubmit}>
            {t("confirmCheckOut")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
