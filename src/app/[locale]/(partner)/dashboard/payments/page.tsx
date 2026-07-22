import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { Badge } from "@/components/ui/badge";
import { ConfirmPaymentButton } from "@/components/partner/confirm-payment-button";
import { RequestRefundButton } from "@/components/partner/request-refund-button";

export default async function PartnerPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Payments");
  const { organization } = await getPartnerContext(locale);

  const payments = await prisma.payment.findMany({
    where: { organizationId: organization.id },
    include: { reservation: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("paymentMethod")}</h1>

      <div className="space-y-2">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <span>
              {payment.reservation?.bookingReference ?? payment.id.slice(0, 8)} ·{" "}
              {payment.provider} · {formatMoney(payment.amount.toString(), payment.currency, locale)}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={payment.status === "PAID" ? "default" : "secondary"}>
                {payment.status}
              </Badge>
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
    </div>
  );
}
