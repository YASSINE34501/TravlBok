import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { Badge } from "@/components/ui/badge";
import { RequestWithdrawalButton } from "@/components/partner/request-withdrawal-button";

export default async function AffiliateWithdrawalsPage({
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
  const withdrawals = await prisma.withdrawal.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { requestedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("affiliateWithdrawals")}</h1>
      <RequestWithdrawalButton locale={locale} organizationId={organization.id} />

      <div className="space-y-2">
        {withdrawals.map((withdrawal) => (
          <div
            key={withdrawal.id}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <span>
              {formatMoney(withdrawal.amount.toString(), withdrawal.currency, locale)} ·{" "}
              {withdrawal.requestedAt.toDateString()}
            </span>
            <Badge variant={withdrawal.status === "PAID" ? "default" : "secondary"}>
              {withdrawal.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
