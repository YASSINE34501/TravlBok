"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changePlanAction, cancelSubscriptionAction } from "@/domains/subscriptions/actions";
import { useRouter } from "@/i18n/navigation";

type Plan = {
  id: string;
  name: string;
  tier: string;
  monthlyPrice: string;
  annualPrice: string;
};

export function SubscriptionPlanSelector({
  locale,
  organizationId,
  currentPlanId,
  cancelAtPeriodEnd,
  plans,
}: {
  locale: string;
  organizationId: string;
  currentPlanId: string;
  cancelAtPeriodEnd: boolean;
  plans: Plan[];
}) {
  const t = useTranslations("Partner");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [planId, setPlanId] = useState(currentPlanId);
  const [billingInterval, setBillingInterval] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const planItems = Object.fromEntries(plans.map((p) => [p.id, p.name]));

  async function handleChangePlan() {
    setIsSubmitting(true);
    try {
      const result = await changePlanAction(locale, organizationId, { planId, billingInterval });
      if (!result.success) {
        toast.error(tCommon("somethingWentWrong"));
        return;
      }
      toast.success(tCommon("success"));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel() {
    setIsCancelling(true);
    try {
      await cancelSubscriptionAction(locale, organizationId);
      toast.success(t("cancelSubscriptionScheduled"));
      router.refresh();
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("changePlan")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cancelAtPeriodEnd && (
          <Badge variant="destructive">{t("cancelSubscriptionScheduled")}</Badge>
        )}
        <div className="grid gap-2 sm:grid-cols-3">
          <Select items={planItems} value={planId} onValueChange={(v) => v && setPlanId(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            items={{ MONTHLY: "Monthly", ANNUAL: "Annual" }}
            value={billingInterval}
            onValueChange={(v) => v && setBillingInterval(v as typeof billingInterval)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="ANNUAL">Annual</SelectItem>
            </SelectContent>
          </Select>
          <Button disabled={isSubmitting} onClick={handleChangePlan}>
            {t("changePlan")}
          </Button>
        </div>
        <Button variant="outline" disabled={isCancelling} onClick={handleCancel}>
          {t("cancelSubscription")}
        </Button>
      </CardContent>
    </Card>
  );
}
