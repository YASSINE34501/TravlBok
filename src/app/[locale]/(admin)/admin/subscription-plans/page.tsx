import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateSubscriptionPlanForm } from "@/components/admin/create-subscription-plan-form";
import { TogglePlanArchivedButton } from "@/components/admin/toggle-plan-archived-button";

export default async function AdminSubscriptionPlansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");

  const plans = await prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("subscriptionPlans")}</h1>
      <CreateSubscriptionPlanForm locale={locale} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                {pickLocaleText(plan.name as Record<string, unknown>, locale)}
              </CardTitle>
              <Badge variant={plan.isArchived ? "secondary" : "default"}>{plan.tier}</Badge>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>
                {plan.monthlyPrice.toString()} MAD/mo · {plan.annualPrice.toString()} MAD/yr
              </p>
              <p>Properties: {plan.maxProperties ?? "Unlimited"}</p>
              <p>Rooms/property: {plan.maxRoomsPerProperty ?? "Unlimited"}</p>
              <p>Vehicles: {plan.maxVehicles ?? "Unlimited"}</p>
              <p>Branches: {plan.maxBranches ?? "Unlimited"}</p>
              <p>Staff: {plan.maxStaff ?? "Unlimited"}</p>
              <p>Monthly bookings: {plan.maxMonthlyBookings ?? "Unlimited"}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {plan.featurePms && <Badge variant="outline">PMS</Badge>}
                {plan.featureAnalytics && <Badge variant="outline">Analytics</Badge>}
                {plan.featureChannelManager && <Badge variant="outline">Channel Manager</Badge>}
                {plan.featureDynamicPricing && <Badge variant="outline">Dynamic Pricing</Badge>}
                {plan.featureApiAccess && <Badge variant="outline">API</Badge>}
                {plan.featureAffiliateTools && <Badge variant="outline">Affiliate Tools</Badge>}
                {plan.featurePrioritySupport && <Badge variant="outline">Priority Support</Badge>}
              </div>
              <div className="pt-2">
                <TogglePlanArchivedButton
                  locale={locale}
                  planId={plan.id}
                  isArchived={plan.isArchived}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
