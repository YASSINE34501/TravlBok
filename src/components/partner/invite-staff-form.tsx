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
}: {
  locale: string;
  organizationId: string;
  availableRoles: Role[];
}) {
  const t = useTranslations("Partner");
  const tCommon = useTranslations("Common");
  const tRoles = useTranslations("Roles");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(availableRoles[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleItems = Object.fromEntries(availableRoles.map((r) => [r, tRoles(r)]));

  async function handleSubmit() {
    if (!email) return;
    setIsSubmitting(true);
    try {
      const result = await inviteStaffMemberAction(locale, organizationId, { email, role });
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        {t("inviteStaff")}
      </Button>
    </div>
  );
}
