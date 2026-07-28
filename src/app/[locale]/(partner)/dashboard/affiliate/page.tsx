import { getTranslations } from "next-intl/server";
import { MousePointerClick, TrendingUp, Wallet, CircleCheck } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { PayoutMethodForm } from "@/components/partner/payout-method-form";
import { getAppUrl } from "@/lib/env";

export default async function AffiliateOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Partner");
  const { organization } = await getPartnerContext(locale);

  const affiliate = await prisma.affiliate.findUniqueOrThrow({
    where: { organizationId: organization.id },
  });

  const [clickCount, commissions] = await Promise.all([
    prisma.affiliateClick.count({ where: { affiliateId: affiliate.id } }),
    prisma.commission.findMany({ where: { affiliateId: affiliate.id } }),
  ]);

  const sum = (status: string) =>
    commissions
      .filter((c) => c.status === status)
      .reduce((total, c) => total + Number(c.amount), 0);

  const currency = commissions[0]?.currency ?? "MAD";
  const appUrl = getAppUrl();
  const referralLink = `${appUrl}/${locale}/r/${affiliate.referralCode}`;

  const payoutMethod = affiliate.payoutMethod as { type?: string; details?: string } | null;

  return (
    <div className="space-y-6">
      <PageHeader title={t("affiliateOverview")} />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">{t("referralLink")}</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="block rounded-lg bg-muted p-2 text-sm">{referralLink}</code>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label={t("totalClicks")} value={clickCount} icon={MousePointerClick} />
        <MetricCard label={t("totalConversions")} value={commissions.length} icon={TrendingUp} />
        <MetricCard
          label={t("pendingCommission")}
          value={formatMoney(sum("PENDING").toString(), currency, locale)}
          icon={Wallet}
        />
        <MetricCard
          label={t("approvedCommission")}
          value={formatMoney(sum("APPROVED").toString(), currency, locale)}
          icon={CircleCheck}
        />
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">{t("payoutMethod")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PayoutMethodForm
            locale={locale}
            organizationId={organization.id}
            initialType={(payoutMethod?.type as "BANK_TRANSFER" | "PAYPAL") ?? "BANK_TRANSFER"}
            initialDetails={payoutMethod?.details ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
