"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignSubscriptionAction } from "@/domains/subscriptions/actions";
import { useRouter } from "@/i18n/navigation";

type Option = { id: string; label: string };

export function AssignSubscriptionForm({
  locale,
  organizations,
  plans,
}: {
  locale: string;
  organizations: Option[];
  plans: Option[];
}) {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orgItems = Object.fromEntries(organizations.map((o) => [o.id, o.label]));
  const planItems = Object.fromEntries(plans.map((p) => [p.id, p.label]));

  async function handleSubmit() {
    if (!organizationId || !planId) return;
    setIsSubmitting(true);
    try {
      await assignSubscriptionAction(locale, organizationId, planId);
      toast.success("Subscription assigned");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <Select items={orgItems} value={organizationId} onValueChange={(v) => v && setOrganizationId(v)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select items={planItems} value={planId} onValueChange={(v) => v && setPlanId(v)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {plans.map((plan) => (
            <SelectItem key={plan.id} value={plan.id}>
              {plan.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        Assign
      </Button>
    </div>
  );
}
