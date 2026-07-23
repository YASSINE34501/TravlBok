"use client";

import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateStaffBranchAction } from "@/domains/staff/actions";
import { useRouter } from "@/i18n/navigation";

export function StaffBranchSelect({
  locale,
  organizationId,
  memberId,
  currentBranchId,
  branches,
}: {
  locale: string;
  organizationId: string;
  memberId: string;
  currentBranchId: string | null;
  branches: { id: string; name: string }[];
}) {
  const router = useRouter();
  const branchItems = Object.fromEntries([
    ["", "Every branch"],
    ...branches.map((b) => [b.id, b.name]),
  ]);

  async function handleChange(value: string | null) {
    const result = await updateStaffBranchAction(locale, organizationId, memberId, value || null);
    if (!result.success) {
      toast.error(result.error ?? "Something went wrong");
      return;
    }
    router.refresh();
  }

  return (
    <Select items={branchItems} value={currentBranchId ?? ""} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-40 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Every branch</SelectItem>
        {branches.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
