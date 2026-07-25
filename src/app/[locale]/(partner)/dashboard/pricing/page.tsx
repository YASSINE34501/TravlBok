import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { hasFeature } from "@/domains/subscriptions/limits";
import { getPricingRulesForOrganization } from "@/domains/dynamic-pricing/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { PricingRuleForm } from "@/components/partner/pricing-rule-form";
import { PricingRuleActions } from "@/components/partner/pricing-rule-actions";
import { PricingCalendarPanel } from "@/components/partner/pricing-calendar-panel";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { organization } = await getPartnerContext(locale);

  if (organization.type !== "HOTEL") {
    return (
      <div className="space-y-4">
        <PageHeader title="Dynamic Pricing" />
        <p className="text-sm text-muted-foreground">
          Dynamic Pricing applies to hotel room types and is only available for hotel
          organizations.
        </p>
      </div>
    );
  }

  const enabled = await hasFeature(organization.id, "featureDynamicPricing");
  if (!enabled) {
    return (
      <div className="space-y-4">
        <PageHeader title="Dynamic Pricing" />
        <p className="text-sm text-muted-foreground">
          Dynamic Pricing is not included in your current subscription plan. Upgrade your plan to
          create occupancy, seasonal, and demand-based pricing rules.
        </p>
      </div>
    );
  }

  const [hotels, rules] = await Promise.all([
    prisma.hotel.findMany({
      where: { organizationId: organization.id, deletedAt: null },
      include: { roomTypes: { where: { isActive: true } } },
    }),
    getPricingRulesForOrganization(organization.id),
  ]);

  const pendingRules = rules.filter((r) => r.approvalStatus === "PENDING");
  const roomTypeOptions = hotels.flatMap((h) =>
    h.roomTypes.map((rt) => ({ id: rt.id, hotelId: h.id, label: `${h.name} · ${rt.name}` }))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dynamic Pricing"
        description="Rule-based nightly price adjustments — no external AI. Rules stack in priority order and are always clamped to each room type's min/max price. A rule marked “requires approval” only takes effect once a manager approves it below."
      />

      {pendingRules.length > 0 && (
        <Card className="rounded-2xl border-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-base">
              Rules awaiting approval ({pendingRules.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingRules.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <span>
                  {rule.hotel.name} · {rule.roomType?.name ?? "All room types"} · {rule.name} (
                  {rule.factor}, {rule.adjustmentType === "PERCENTAGE" ? `${Number(rule.adjustmentValue)}%` : Number(rule.adjustmentValue)}
                  ) · created by {rule.createdBy.firstName} {rule.createdBy.lastName}
                </span>
                <PricingRuleActions
                  locale={locale}
                  organizationId={organization.id}
                  ruleId={rule.id}
                  isActive={rule.isActive}
                  approvalStatus={rule.approvalStatus}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Create a pricing rule</CardTitle>
        </CardHeader>
        <CardContent>
          <PricingRuleForm
            locale={locale}
            organizationId={organization.id}
            hotels={hotels.map((h) => ({
              id: h.id,
              name: h.name,
              roomTypes: h.roomTypes.map((rt) => ({ id: rt.id, name: rt.name })),
            }))}
          />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Rules</h2>
        {rules.length === 0 && (
          <p className="text-sm text-muted-foreground">No pricing rules yet.</p>
        )}
        {rules.map((rule) => (
          <Card key={rule.id} className="rounded-2xl">
            <CardContent className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm">
              <div>
                <p className="font-medium text-foreground">
                  {rule.name}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {rule.hotel.name} · {rule.roomType?.name ?? "All room types"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {rule.factor} · {rule.adjustmentType === "PERCENTAGE" ? `${Number(rule.adjustmentValue)}%` : Number(rule.adjustmentValue)}{" "}
                  · priority {rule.priority}
                  {rule.description ? ` · ${rule.description}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone={rule.isActive ? "success" : "neutral"}>
                  {rule.isActive ? "Active" : "Inactive"}
                </StatusBadge>
                <StatusBadge
                  tone={
                    rule.approvalStatus === "APPROVED"
                      ? "success"
                      : rule.approvalStatus === "REJECTED"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {rule.approvalStatus}
                </StatusBadge>
                <PricingRuleActions
                  locale={locale}
                  organizationId={organization.id}
                  ruleId={rule.id}
                  isActive={rule.isActive}
                  approvalStatus={rule.approvalStatus}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Simulate & pricing calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <PricingCalendarPanel
            locale={locale}
            organizationId={organization.id}
            roomTypeOptions={roomTypeOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
