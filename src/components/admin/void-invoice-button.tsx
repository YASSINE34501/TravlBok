"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { voidInvoiceAction } from "@/domains/payments/actions";
import { useRouter } from "@/i18n/navigation";

export function VoidInvoiceButton({ locale, invoiceId }: { locale: string; invoiceId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="destructive"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await voidInvoiceAction(locale, invoiceId);
          router.refresh();
        })
      }
    >
      Void
    </Button>
  );
}
