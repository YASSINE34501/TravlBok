import { getTranslations } from "next-intl/server";
import { Wallet } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { PageHeader } from "@/components/ui/page-header";
import { DataTableShell } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmPaymentButton } from "@/components/partner/confirm-payment-button";
import { RequestRefundButton } from "@/components/partner/request-refund-button";
import { PAYMENT_TRANSACTION_STATUS_TONE } from "@/lib/status-tones";

export default async function PartnerPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Payments");
  const tStatus = await getTranslations("PaymentTransactionStatus");
  const tCommon = await getTranslations("Common");
  const { organization } = await getPartnerContext(locale);

  const payments = await prisma.payment.findMany({
    where: { organizationId: organization.id },
    include: { reservation: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t("paymentMethod")} />

      <DataTableShell>
        {payments.length === 0 ? (
          <EmptyState icon={Wallet} title={tCommon("noResults")} className="border-0 py-12" />
        ) : (
          <div className="divide-y">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-sm sm:px-5"
              >
                <span className="text-foreground">
                  {payment.reservation?.bookingReference ?? payment.id.slice(0, 8)} ·{" "}
                  <span className="text-muted-foreground">{payment.provider}</span> ·{" "}
                  {formatMoney(payment.amount.toString(), payment.currency, locale)}
                </span>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={PAYMENT_TRANSACTION_STATUS_TONE[payment.status]}>
                    {tStatus(payment.status)}
                  </StatusBadge>
                  {payment.status === "PENDING" &&
                    ["BANK_TRANSFER", "MANUAL", "CASH_AT_PROPERTY"].includes(payment.provider) && (
                      <ConfirmPaymentButton
                        locale={locale}
                        organizationId={organization.id}
                        paymentId={payment.id}
                      />
                    )}
                  {payment.status === "PAID" && (
                    <RequestRefundButton
                      locale={locale}
                      organizationId={organization.id}
                      paymentId={payment.id}
                      maxAmount={Number(payment.amount)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DataTableShell>
    </div>
  );
}
