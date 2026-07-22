"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createWalkInReservationAction } from "@/domains/pms/actions";
import { useRouter } from "@/i18n/navigation";

type RoomTypeOption = { id: string; name: string };

export function WalkInDialog({
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
  const [open, setOpen] = useState(false);
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id ?? "");
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roomTypeItems = Object.fromEntries(roomTypes.map((r) => [r.id, r.name]));

  async function handleSubmit() {
    if (!roomTypeId || !checkInDate || !checkOutDate || !guestFirstName || !guestEmail) return;
    setIsSubmitting(true);
    try {
      const result = await createWalkInReservationAction(locale, organizationId, {
        hotelId,
        roomTypeId,
        checkInDate,
        checkOutDate,
        guestFirstName,
        guestLastName,
        guestEmail,
        guestPhone: guestPhone || undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Walk-in booking created");
      setOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Walk-in booking</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New walk-in booking</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Select items={roomTypeItems} value={roomTypeId} onValueChange={(v) => v && setRoomTypeId(v)}>
            <SelectTrigger className="w-full">
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
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} />
            <Input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
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
          </div>
          <Input
            type="email"
            placeholder="Email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
          />
          <Input
            type="tel"
            placeholder="Phone"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button disabled={isSubmitting} onClick={handleSubmit}>
            Create booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
