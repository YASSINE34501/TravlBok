"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRoomMappingAction } from "@/domains/channel-manager/actions";
import { useRouter } from "@/i18n/navigation";

type RoomTypeOption = { id: string; name: string };

export function RoomMappingForm({
  locale,
  organizationId,
  channelConnectionId,
  roomTypes,
}: {
  locale: string;
  organizationId: string;
  channelConnectionId: string;
  roomTypes: RoomTypeOption[];
}) {
  const router = useRouter();
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id ?? "");
  const [externalRoomId, setExternalRoomId] = useState("");
  const [externalRatePlanId, setExternalRatePlanId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = Object.fromEntries(roomTypes.map((r) => [r.id, r.name]));

  async function handleSubmit() {
    if (!roomTypeId || !externalRoomId) return;
    setIsSubmitting(true);
    try {
      const result = await createRoomMappingAction(locale, organizationId, {
        channelConnectionId,
        roomTypeId,
        externalRoomId,
        externalRatePlanId: externalRatePlanId || undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Room mapped");
      setExternalRoomId("");
      setExternalRatePlanId("");
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
      <Input
        placeholder="External room ID"
        value={externalRoomId}
        onChange={(e) => setExternalRoomId(e.target.value)}
      />
      <Input
        placeholder="External rate plan ID (optional)"
        value={externalRatePlanId}
        onChange={(e) => setExternalRatePlanId(e.target.value)}
      />
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        Map room
      </Button>
    </div>
  );
}
