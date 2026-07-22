import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddCancellationPolicyForm } from "@/components/admin/add-cancellation-policy-form";

export default async function AdminCancellationPoliciesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");

  const policies = await prisma.cancellationPolicy.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("cancellationPolicies")}</h1>
      <AddCancellationPolicyForm locale={locale} />

      <div className="space-y-3">
        {policies.map((policy) => (
          <Card key={policy.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {pickLocaleText(policy.name as Record<string, unknown>, locale)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{pickLocaleText(policy.description as Record<string, unknown>, locale)}</p>
              <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(policy.rules, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
