import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayoutMethodForm } from "@/components/partner/payout-method-form";

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const referralLink = `${appUrl}/${locale}/r/${affiliate.referralCode}`;

  const payoutMethod = affiliate.payoutMethod as { type?: string; details?: string } | null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("affiliateOverview")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("referralLink")}</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="block rounded bg-muted p-2 text-sm">{referralLink}</code>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("totalClicks")}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{clickCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t("totalConversions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{commissions.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t("pendingCommission")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(sum("PENDING").toString(), currency, locale)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t("approvedCommission")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(sum("APPROVED").toString(), currency, locale)}
          </CardContent>
        </Card>
      </div>

      <Card>
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
