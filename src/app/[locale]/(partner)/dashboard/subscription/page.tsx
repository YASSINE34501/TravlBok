import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubscriptionPlanSelector } from "@/components/partner/subscription-plan-selector";

export default async function SubscriptionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Partner");
  const { organization } = await getPartnerContext(locale);

  const [subscription, plans] = await Promise.all([
    prisma.subscription.findUnique({
      where: { organizationId: organization.id },
      include: { plan: true },
    }),
    prisma.subscriptionPlan.findMany({ where: { isArchived: false }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("subscription")}</h1>

      {subscription ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("currentPlan")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="text-lg font-semibold">
                {pickLocaleText(subscription.plan.name as Record<string, unknown>, locale)}
              </p>
              <Badge variant={subscription.status === "ACTIVE" ? "default" : "secondary"}>
                {subscription.status}
              </Badge>
              <p className="text-muted-foreground">
                Billing: {subscription.billingInterval} · Renews{" "}
                {subscription.currentPeriodEnd.toDateString()}
              </p>
            </CardContent>
          </Card>

          <SubscriptionPlanSelector
            locale={locale}
            organizationId={organization.id}
            currentPlanId={subscription.planId}
            cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
            plans={plans.map((p) => ({
              id: p.id,
              name: pickLocaleText(p.name as Record<string, unknown>, locale),
              tier: p.tier,
              monthlyPrice: p.monthlyPrice.toString(),
              annualPrice: p.annualPrice.toString(),
            }))}
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No subscription found.</p>
      )}
    </div>
  );
}
