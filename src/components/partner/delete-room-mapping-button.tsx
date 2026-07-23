"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { deleteRoomMappingAction } from "@/domains/channel-manager/actions";
import { useRouter } from "@/i18n/navigation";

export function DeleteRoomMappingButton({
  locale,
  organizationId,
  mappingId,
}: {
  locale: string;
  organizationId: string;
  mappingId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteRoomMappingAction(locale, organizationId, mappingId);
          router.refresh();
        })
      }
    >
      <X className="size-3.5" />
    </button>
  );
}
