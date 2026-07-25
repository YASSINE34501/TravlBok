"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateRoomInventoryUnitsAction } from "@/domains/pms/actions";
import { useRouter } from "@/i18n/navigation";

type RoomTypeOption = { id: string; name: string };

export function GenerateRoomInventoryForm({
  locale,
  organizationId,
  hotelId,
  roomTypes,
}: {
  locale: string;
  organizationId: string;
  hotelId: string;
  roomTypes: RoomTypeOption[];
}) {
  const router = useRouter();
  const t = useTranslations("Pms");
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id ?? "");
  const [count, setCount] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = Object.fromEntries(roomTypes.map((r) => [r.id, r.name]));

  async function handleSubmit() {
    if (!roomTypeId || !count) return;
    setIsSubmitting(true);
    try {
      const result = await generateRoomInventoryUnitsAction(
        locale,
        organizationId,
        hotelId,
        roomTypeId,
        Number(count)
      );
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t("roomsGenerated"));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Select items={items} value={roomTypeId} onValueChange={(v) => v && setRoomTypeId(v)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {roomTypes.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} />
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        {t("generateRoomUnits")}
      </Button>
    </div>
  );
}
