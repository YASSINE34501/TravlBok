"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updatePartnerReservationStatusAction } from "@/domains/reservations/actions";
import { useRouter } from "@/i18n/navigation";

const STATUSES = ["CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"] as const;
const STATUS_ITEMS = Object.fromEntries(STATUSES.map((s) => [s, s]));

export function ReservationStatusSelect({
  locale,
  organizationId,
  reservationId,
  currentStatus,
}: {
  locale: string;
  organizationId: string;
  reservationId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string | null) {
    if (!value || !STATUSES.includes(value as (typeof STATUSES)[number])) return;
    startTransition(async () => {
      const result = await updatePartnerReservationStatusAction(
        locale,
        organizationId,
        reservationId,
        value as (typeof STATUSES)[number]
      );
      if (result.success) {
        toast.success("Updated");
        router.refresh();
      }
    });
  }

  return (
    <Select
      items={STATUS_ITEMS}
      value={currentStatus}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
