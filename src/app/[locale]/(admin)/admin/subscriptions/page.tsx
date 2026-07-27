import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { formatMoney } from "@/lib/currency/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignSubscriptionForm } from "@/components/admin/assign-subscription-form";
import { SuspendSubscriptionButton } from "@/components/admin/suspend-subscription-button";

export default async function AdminSubscriptionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");
  const tCommon = await getTranslations("Common");
  const tStatus = await getTranslations("SubscriptionStatus");

  const [subscriptions, organizations, plans] = await Promise.all([
    prisma.subscription.findMany({
      include: { organization: true, plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.organization.findMany({ orderBy: { displayName: "asc" } }),
    prisma.subscriptionPlan.findMany({ where: { isArchived: false }, orderBy: { sortOrder: "asc" } }),
  ]);

  const mrr = subscriptions
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => {
      const monthly =
        s.billingInterval === "ANNUAL"
          ? Number(s.plan.annualPrice) / 12
          : Number(s.plan.monthlyPrice);
      return sum + monthly;
    }, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("subscriptions")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("recurringRevenue")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            {formatMoney(mrr, "MAD", locale)} / {tCommon("perMonth")}
          </p>
        </CardContent>
      </Card>

      <AssignSubscriptionForm
        locale={locale}
        organizations={organizations.map((o) => ({ id: o.id, label: o.displayName }))}
        plans={plans.map((p) => ({
          id: p.id,
          label: pickLocaleText(p.name as Record<string, unknown>, locale),
        }))}
      />

      <div className="space-y-2">
        {subscriptions.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <span>
              {sub.organization.displayName} ·{" "}
              {pickLocaleText(sub.plan.name as Record<string, unknown>, locale)} ·{" "}
              {sub.billingInterval}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={sub.status === "ACTIVE" ? "default" : "secondary"}>
                {tStatus(sub.status)}
              </Badge>
              {sub.status !== "SUSPENDED" && (
                <SuspendSubscriptionButton locale={locale} organizationId={sub.organizationId} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
