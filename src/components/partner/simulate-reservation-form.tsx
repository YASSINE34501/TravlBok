"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import { simulateIncomingReservationAction } from "@/domains/channel-manager/actions";
import { useRouter } from "@/i18n/navigation";

type MappingOption = { externalRoomId: string; label: string };

export function SimulateReservationForm({
  locale,
  organizationId,
  channelConnectionId,
  mappings,
}: {
  locale: string;
  organizationId: string;
  channelConnectionId: string;
  mappings: MappingOption[];
}) {
  const router = useRouter();
  const t = useTranslations("Partner");
  const [externalRoomId, setExternalRoomId] = useState(mappings[0]?.externalRoomId ?? "");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guestFirstName, setGuestFirstName] = useState("Test");
  const [guestLastName, setGuestLastName] = useState("Guest");
  const [guestEmail, setGuestEmail] = useState("test-guest@example.com");
  const [totalAmount, setTotalAmount] = useState("1000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = Object.fromEntries(mappings.map((m) => [m.externalRoomId, m.label]));

  async function handleSubmit() {
    if (!externalRoomId || !checkInDate || !checkOutDate) return;
    setIsSubmitting(true);
    try {
      const result = await simulateIncomingReservationAction(locale, organizationId, {
        channelConnectionId,
        externalRoomId,
        checkInDate,
        checkOutDate,
        guestFirstName,
        guestLastName,
        guestEmail,
        totalAmount: Number(totalAmount),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t("reservationImported"));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (mappings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Map at least one room before simulating an incoming reservation.
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-md border p-4">
      <p className="text-xs text-muted-foreground">
        Simulates a booking arriving from the channel — exercises the same import, conflict
        detection, and payment pipeline a real webhook delivery would.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Select items={items} value={externalRoomId} onValueChange={(v) => v && setExternalRoomId(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {mappings.map((m) => (
              <SelectItem key={m.externalRoomId} value={m.externalRoomId}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} />
        <Input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} />
        <Input
          placeholder="First name"
          value={guestFirstName}
          onChange={(e) => setGuestFirstName(e.target.value)}
        />
        <Input
          placeholder="Last name"
          value={guestLastName}
          onChange={(e) => setGuestLastName(e.target.value)}
        />
        <Input
          type="email"
          placeholder="Guest email"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Total amount"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
        />
      </div>
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        Simulate incoming reservation
      </Button>
    </div>
  );
}
