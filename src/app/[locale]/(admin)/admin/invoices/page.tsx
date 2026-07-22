import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { Badge } from "@/components/ui/badge";
import { VoidInvoiceButton } from "@/components/admin/void-invoice-button";

export default async function AdminInvoicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Payments");

  const invoices = await prisma.invoice.findMany({
    include: { organization: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("invoiceNumber")}</h1>

      <div className="space-y-2">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <span>
              {invoice.invoiceNumber} · {invoice.organization?.displayName ?? invoice.type} ·{" "}
              {formatMoney(invoice.totalAmount.toString(), invoice.currency, locale)}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={invoice.status === "PAID" ? "default" : "secondary"}>
                {invoice.status}
              </Badge>
              {invoice.status !== "VOID" && (
                <VoidInvoiceButton locale={locale} invoiceId={invoice.id} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
