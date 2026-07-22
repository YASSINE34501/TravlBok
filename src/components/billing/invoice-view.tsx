import { formatMoney } from "@/lib/currency/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { CurrencyCode } from "@/lib/currency/config";

type InvoiceLineItem = {
  id: string;
  description: string;
  amount: string;
  quantity: number;
};

export function InvoiceView({
  locale,
  invoiceNumber,
  status,
  currency,
  issuedAt,
  lineItems,
  totalAmount,
}: {
  locale: string;
  invoiceNumber: string;
  status: string;
  currency: CurrencyCode;
  issuedAt: Date | null;
  lineItems: InvoiceLineItem[];
  totalAmount: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{invoiceNumber}</CardTitle>
        <Badge variant={status === "PAID" ? "default" : "secondary"}>{status}</Badge>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {issuedAt && (
          <p className="text-muted-foreground">{issuedAt.toDateString()}</p>
        )}
        {lineItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {item.description}
              {item.quantity > 1 ? ` × ${item.quantity}` : ""}
            </span>
            <span>{formatMoney(item.amount, currency, locale)}</span>
          </div>
        ))}
        <Separator />
        <div className="flex items-center justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatMoney(totalAmount, currency, locale)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
