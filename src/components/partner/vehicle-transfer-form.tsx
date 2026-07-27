"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { transferVehicleAction } from "@/domains/vehicles/actions";
import { useRouter } from "@/i18n/navigation";

export function VehicleTransferForm({
  locale,
  organizationId,
  vehicleId,
  currentBranchId,
  branches,
}: {
  locale: string;
  organizationId: string;
  vehicleId: string;
  currentBranchId: string;
  branches: { id: string; name: string }[];
}) {
  const router = useRouter();
  const t = useTranslations("Partner");
  const [targetBranchId, setTargetBranchId] = useState(currentBranchId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const branchItems = Object.fromEntries(branches.map((b) => [b.id, b.name]));

  async function handleTransfer() {
    if (targetBranchId === currentBranchId) return;
    setIsSubmitting(true);
    try {
      const result = await transferVehicleAction(locale, organizationId, vehicleId, targetBranchId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t("vehicleTransferred"));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select items={branchItems} value={targetBranchId} onValueChange={(v) => v && setTargetBranchId(v)}>
        <SelectTrigger className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        disabled={isSubmitting || targetBranchId === currentBranchId}
        onClick={handleTransfer}
      >
        Transfer to branch
      </Button>
    </div>
  );
}
