import { getTranslations } from "next-intl/server";
import { getAllPricingRulesForAdmin } from "@/domains/dynamic-pricing/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingRuleStatusButton } from "@/components/admin/pricing-rule-status-button";

export default async function AdminPricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");

  const rules = await getAllPricingRulesForAdmin();
  const pendingCount = rules.filter((r) => r.approvalStatus === "PENDING").length;
  const activeCount = rules.filter((r) => r.isActive && r.approvalStatus === "APPROVED").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("dynamicPricing")}</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Active rules</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{activeCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Awaiting approval</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{pendingCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total rules</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{rules.length}</CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">All pricing rules</h2>
        <div className="mt-2 space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <span>
                {rule.hotel.organization.displayName} · {rule.hotel.name} ·{" "}
                {rule.roomType?.name ?? "All room types"} · {rule.name} · {rule.factor}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant={rule.isActive ? "default" : "secondary"}>
                  {rule.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge
                  variant={
                    rule.approvalStatus === "APPROVED"
                      ? "default"
                      : rule.approvalStatus === "REJECTED"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {rule.approvalStatus}
                </Badge>
                {rule.approvalStatus === "PENDING" && (
                  <>
                    <PricingRuleStatusButton locale={locale} ruleId={rule.id} status="APPROVED" />
                    <PricingRuleStatusButton locale={locale} ruleId={rule.id} status="REJECTED" />
                  </>
                )}
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <p className="text-sm text-muted-foreground">No pricing rules yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
