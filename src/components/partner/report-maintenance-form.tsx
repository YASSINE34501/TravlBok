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
import { reportMaintenanceIssueAction } from "@/domains/housekeeping/actions";
import { useRouter } from "@/i18n/navigation";

type RoomOption = { id: string; unitNumber: string };

export function ReportMaintenanceForm({
  locale,
  organizationId,
  hotelId,
  rooms,
}: {
  locale: string;
  organizationId: string;
  hotelId: string;
  rooms: RoomOption[];
}) {
  const router = useRouter();
  const [roomInventoryId, setRoomInventoryId] = useState("NONE");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roomItems: Record<string, string> = {
    NONE: "General (no specific room)",
    ...Object.fromEntries(rooms.map((r) => [r.id, r.unitNumber])),
  };

  async function handleSubmit() {
    if (!title) return;
    setIsSubmitting(true);
    try {
      await reportMaintenanceIssueAction(locale, organizationId, {
        hotelId,
        roomInventoryId: roomInventoryId === "NONE" ? undefined : roomInventoryId,
        title,
        priority,
      });
      toast.success("Issue reported");
      setTitle("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Select items={roomItems} value={roomInventoryId} onValueChange={(v) => v && setRoomInventoryId(v)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NONE">General (no specific room)</SelectItem>
          {rooms.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.unitNumber}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input placeholder="Issue" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Select
        items={{ LOW: "Low", NORMAL: "Normal", HIGH: "High", URGENT: "Urgent" }}
        value={priority}
        onValueChange={(v) => v && setPriority(v as typeof priority)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="LOW">Low</SelectItem>
          <SelectItem value="NORMAL">Normal</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
          <SelectItem value="URGENT">Urgent</SelectItem>
        </SelectContent>
      </Select>
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        Report issue
      </Button>
    </div>
  );
}
