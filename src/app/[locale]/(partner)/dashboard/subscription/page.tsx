import { getTranslations } from "next-intl/server";
import { CreditCard } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SubscriptionPlanSelector } from "@/components/partner/subscription-plan-selector";
import { SUBSCRIPTION_STATUS_TONE } from "@/lib/status-tones";

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
      <PageHeader title={t("subscription")} />

      {subscription ? (
        <>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>{t("currentPlan")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-lg font-semibold text-foreground">
                {pickLocaleText(subscription.plan.name as Record<string, unknown>, locale)}
              </p>
              <StatusBadge tone={SUBSCRIPTION_STATUS_TONE[subscription.status]}>
                {subscription.status}
              </StatusBadge>
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
        <EmptyState icon={CreditCard} title="No subscription found" />
      )}
    </div>
  );
}
