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
  const t = useTranslations("Pms");
  const tPriority = useTranslations("TaskPriority");
  const [roomInventoryId, setRoomInventoryId] = useState("NONE");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roomItems: Record<string, string> = {
    NONE: t("generalNoRoom"),
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
      toast.success(t("issueReported"));
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
          <SelectItem value="NONE">{t("generalNoRoom")}</SelectItem>
          {rooms.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.unitNumber}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input placeholder={t("issue")} value={title} onChange={(e) => setTitle(e.target.value)} />
      <Select
        items={{
          LOW: tPriority("LOW"),
          NORMAL: tPriority("NORMAL"),
          HIGH: tPriority("HIGH"),
          URGENT: tPriority("URGENT"),
        }}
        value={priority}
        onValueChange={(v) => v && setPriority(v as typeof priority)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="LOW">{tPriority("LOW")}</SelectItem>
          <SelectItem value="NORMAL">{tPriority("NORMAL")}</SelectItem>
          <SelectItem value="HIGH">{tPriority("HIGH")}</SelectItem>
          <SelectItem value="URGENT">{tPriority("URGENT")}</SelectItem>
        </SelectContent>
      </Select>
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        {t("reportIssue")}
      </Button>
    </div>
  );
}
