"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintInvoiceButton({ label }: { label: string }) {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Download className="size-4" />
      {label}
    </Button>
  );
}
