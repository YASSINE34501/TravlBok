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
import { checkInGuestAction } from "@/domains/pms/actions";
import { useRouter } from "@/i18n/navigation";

type RoomOption = { id: string; unitNumber: string };

export function CheckInDialog({
  locale,
  organizationId,
  reservationId,
  guestName,
  availableRooms,
}: {
  locale: string;
  organizationId: string;
  reservationId: string;
  guestName: string;
  availableRooms: RoomOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roomInventoryId, setRoomInventoryId] = useState(availableRooms[0]?.id ?? "");
  const [idDocumentRef, setIdDocumentRef] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roomItems = Object.fromEntries(availableRooms.map((r) => [r.id, r.unitNumber]));

  async function handleSubmit() {
    if (!roomInventoryId) return;
    setIsSubmitting(true);
    try {
      const result = await checkInGuestAction(locale, organizationId, reservationId, {
        roomInventoryId,
        idDocumentRef: idDocumentRef || undefined,
        depositAmount: depositAmount ? Number(depositAmount) : undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Checked in");
      setOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Check in</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check in — {guestName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Select items={roomItems} value={roomInventoryId} onValueChange={(v) => v && setRoomInventoryId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableRooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.unitNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="ID document reference"
            value={idDocumentRef}
            onChange={(e) => setIdDocumentRef(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Deposit amount (optional)"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button disabled={isSubmitting || !roomInventoryId} onClick={handleSubmit}>
            Confirm check-in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
