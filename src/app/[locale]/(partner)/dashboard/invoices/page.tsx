import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { InvoiceView } from "@/components/billing/invoice-view";

export default async function PartnerInvoicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Payments");
  const { organization } = await getPartnerContext(locale);

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: organization.id },
    include: { lineItems: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("invoiceNumber")}</h1>

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
    </div>
  );
}
