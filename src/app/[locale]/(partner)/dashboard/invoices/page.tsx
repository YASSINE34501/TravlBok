import { getTranslations } from "next-intl/server";
import { Receipt } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { InvoiceView } from "@/components/billing/invoice-view";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function PartnerInvoicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Payments");
  const tCommon = await getTranslations("Common");
  const { organization } = await getPartnerContext(locale);

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: organization.id },
    include: { lineItems: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t("invoiceNumber")} />

      {invoices.length === 0 ? (
        <EmptyState icon={Receipt} title={tCommon("noResults")} />
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <InvoiceView
              key={invoice.id}
              locale={locale}
              invoiceNumber={invoice.invoiceNumber}
              status={invoice.status}
              currency={invoice.currency}
              issuedAt={invoice.issuedAt}
              totalAmount={invoice.totalAmount.toString()}
              lineItems={invoice.lineItems.map((item) => ({
                id: item.id,
                description: item.description,
                amount: item.amount.toString(),
                quantity: item.quantity,
              }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
