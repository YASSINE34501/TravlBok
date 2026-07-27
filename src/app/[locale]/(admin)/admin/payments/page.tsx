import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { Badge } from "@/components/ui/badge";

export default async function AdminPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Payments");
  const tStatus = await getTranslations("PaymentTransactionStatus");

  const payments = await prisma.payment.findMany({
    include: { organization: true, reservation: true },
    orderBy: { createdAt: "desc" },
    take: 200,
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
              {payment.organization?.displayName ?? "—"} ·{" "}
              {payment.reservation?.bookingReference ?? payment.id.slice(0, 8)} ·{" "}
              {payment.provider} · {formatMoney(payment.amount.toString(), payment.currency, locale)}
            </span>
            <Badge variant={payment.status === "PAID" ? "default" : "secondary"}>
              {tStatus(payment.status)}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
