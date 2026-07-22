"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { removeStaffMemberAction } from "@/domains/staff/actions";
import { useRouter } from "@/i18n/navigation";

export function RemoveStaffButton({
  locale,
  organizationId,
  memberId,
}: {
  locale: string;
  organizationId: string;
  memberId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await removeStaffMemberAction(locale, organizationId, memberId);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          router.refresh();
        })
      }
    >
      <X className="size-3.5" />
    </button>
  );
}
