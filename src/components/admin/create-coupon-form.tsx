"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCouponAction } from "@/domains/admin/actions";
import { useRouter } from "@/i18n/navigation";

export function CreateCouponForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [scope, setScope] = useState<"ALL" | "HOTEL" | "CAR">("ALL");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!code || !value || !validFrom || !validTo) return;
    setIsSubmitting(true);
    try {
      await createCouponAction(locale, {
        code: code.toUpperCase(),
        type,
        value: Number(value),
        scope,
        validFrom,
        validTo,
      });
      toast.success("Coupon created");
      setCode("");
      setValue("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
      <Input placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value)} />
      <Select
        items={{ PERCENTAGE: "%", FIXED: "Fixed" }}
        value={type}
        onValueChange={(v) => v && setType(v as typeof type)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PERCENTAGE">%</SelectItem>
          <SelectItem value="FIXED">Fixed</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="number"
        placeholder="Value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Select
        items={{ ALL: "All", HOTEL: "Hotel", CAR: "Car" }}
        value={scope}
        onValueChange={(v) => v && setScope(v as typeof scope)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All</SelectItem>
          <SelectItem value="HOTEL">Hotel</SelectItem>
          <SelectItem value="CAR">Car</SelectItem>
        </SelectContent>
      </Select>
      <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
      <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
      <Button disabled={isSubmitting} onClick={handleSubmit} className="col-span-2 sm:col-span-1">
        Create
      </Button>
    </div>
  );
}
