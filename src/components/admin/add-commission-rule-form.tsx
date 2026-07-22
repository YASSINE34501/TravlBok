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
import { createCommissionRuleAction } from "@/domains/admin/actions";
import { useRouter } from "@/i18n/navigation";

type OrganizationOption = { id: string; name: string };

export function AddCommissionRuleForm({
  locale,
  organizations,
}: {
  locale: string;
  organizations: OrganizationOption[];
}) {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState("PLATFORM_DEFAULT");
  const [serviceType, setServiceType] = useState<"HOTEL" | "CAR">("HOTEL");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const organizationItems: Record<string, string> = {
    PLATFORM_DEFAULT: "Platform default (all partners)",
    ...Object.fromEntries(organizations.map((o) => [o.id, o.name])),
  };

  async function handleSubmit() {
    if (!value) return;
    setIsSubmitting(true);
    try {
      await createCommissionRuleAction(locale, {
        organizationId: organizationId === "PLATFORM_DEFAULT" ? null : organizationId,
        serviceType,
        type,
        value: Number(value),
      });
      toast.success("Commission rule added");
      setValue("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      <Select
        items={organizationItems}
        value={organizationId}
        onValueChange={(v) => v && setOrganizationId(v)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PLATFORM_DEFAULT">Platform default (all partners)</SelectItem>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={{ HOTEL: "Hotel", CAR: "Car" }}
        value={serviceType}
        onValueChange={(v) => v && setServiceType(v as typeof serviceType)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="HOTEL">Hotel</SelectItem>
          <SelectItem value="CAR">Car</SelectItem>
        </SelectContent>
      </Select>
      <Select
        items={{ PERCENTAGE: "Percentage", FIXED: "Fixed" }}
        value={type}
        onValueChange={(v) => v && setType(v as typeof type)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PERCENTAGE">Percentage</SelectItem>
          <SelectItem value="FIXED">Fixed</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="number"
        placeholder="Value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        Add
      </Button>
    </div>
  );
}
