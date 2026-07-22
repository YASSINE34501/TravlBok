import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { AddCommissionRuleForm } from "@/components/admin/add-commission-rule-form";
import { DeleteCommissionRuleButton } from "@/components/admin/delete-commission-rule-button";

export default async function AdminCommissionRulesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");

  const [rules, organizations] = await Promise.all([
    prisma.commissionRule.findMany({
      include: { organization: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.organization.findMany({ orderBy: { displayName: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("commissions")}</h1>
      <AddCommissionRuleForm
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
              {rule.organization?.displayName ?? "Platform default"} · {rule.serviceType} ·{" "}
              {rule.type === "PERCENTAGE" ? `${rule.value.toString()}%` : rule.value.toString()}
            </span>
            <DeleteCommissionRuleButton locale={locale} commissionRuleId={rule.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
