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
import { inviteStaffMemberAction } from "@/domains/staff/actions";
import { useRouter } from "@/i18n/navigation";
import type { Role } from "@/generated/prisma/client";

export function InviteStaffForm({
  locale,
  organizationId,
  availableRoles,
  branches,
}: {
  locale: string;
  organizationId: string;
  availableRoles: Role[];
  branches?: { id: string; name: string }[];
}) {
  const t = useTranslations("Partner");
  const tCommon = useTranslations("Common");
  const tRoles = useTranslations("Roles");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(availableRoles[0]);
  const [branchId, setBranchId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleItems = Object.fromEntries(availableRoles.map((r) => [r, tRoles(r)]));
  const branchItems = branches
    ? Object.fromEntries([["", "Every branch"], ...branches.map((b) => [b.id, b.name])])
    : undefined;

  async function handleSubmit() {
    if (!email) return;
    setIsSubmitting(true);
    try {
      const result = await inviteStaffMemberAction(locale, organizationId, {
        email,
        role,
        branchId: branchId || undefined,
      });
      if (!result.success) {
        toast.error(tCommon("somethingWentWrong"));
        return;
      }
      toast.success(tCommon("success"));
      setEmail("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={`grid grid-cols-2 gap-2 ${branches ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
      <Input
        type="email"
        placeholder={t("staffEmailPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="sm:col-span-2"
      />
      <Select items={roleItems} value={role} onValueChange={(v) => v && setRole(v as Role)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((r) => (
            <SelectItem key={r} value={r}>
              {tRoles(r)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {branches && branchItems && (
        <Select items={branchItems} value={branchId} onValueChange={(v) => setBranchId(v ?? "")}>
          <SelectTrigger>
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
      )}
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        {t("inviteStaff")}
      </Button>
    </div>
  );
}
