import { getTranslations } from "next-intl/server";
import { Wallet } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { DataTableShell } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { RequestWithdrawalButton } from "@/components/partner/request-withdrawal-button";
import { WITHDRAWAL_STATUS_TONE } from "@/lib/status-tones";

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
      <PageHeader title={t("affiliateWithdrawals")} />
      <RequestWithdrawalButton locale={locale} organizationId={organization.id} />

      {withdrawals.length === 0 ? (
        <EmptyState icon={Wallet} title="No withdrawals yet" />
      ) : (
        <DataTableShell>
          <div className="divide-y">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="flex items-center justify-between px-4 py-3.5 text-sm sm:px-5"
              >
                <span className="text-foreground">
                  {formatMoney(withdrawal.amount.toString(), withdrawal.currency, locale)} ·{" "}
                  <span className="text-muted-foreground">
                    {withdrawal.requestedAt.toDateString()}
                  </span>
                </span>
                <StatusBadge tone={WITHDRAWAL_STATUS_TONE[withdrawal.status]}>
                  {withdrawal.status}
                </StatusBadge>
              </div>
            ))}
          </div>
        </DataTableShell>
      )}
    </div>
  );
}
