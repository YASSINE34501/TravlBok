import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { AddAffiliateCommissionRuleForm } from "@/components/admin/add-affiliate-commission-rule-form";
import { DeleteAffiliateCommissionRuleButton } from "@/components/admin/delete-affiliate-commission-rule-button";

export default async function AdminAffiliateCommissionRulesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");

  const [rules, organizations] = await Promise.all([
    prisma.affiliateCommissionRule.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.organization.findMany({ orderBy: { displayName: "asc" } }),
  ]);
  const orgById = new Map(organizations.map((o) => [o.id, o.displayName]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("affiliateCommissionRules")}</h1>
      <AddAffiliateCommissionRuleForm
        locale={locale}
        organizations={organizations.map((o) => ({ id: o.id, name: o.displayName }))}
      />

      <div className="space-y-2">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <span>
              {rule.organizationId ? orgById.get(rule.organizationId) : t("platformDefault")} ·{" "}
              {rule.serviceType} · {rule.type === "PERCENTAGE" ? `${rule.value.toString()}%` : rule.value.toString()}
            </span>
            <DeleteAffiliateCommissionRuleButton locale={locale} ruleId={rule.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
