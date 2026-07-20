import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddExchangeRateForm } from "@/components/admin/add-exchange-rate-form";

export default async function AdminExchangeRatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");

  const rates = await prisma.exchangeRate.findMany({
    orderBy: { effectiveAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("exchangeRates")}</h1>
      <AddExchangeRateForm locale={locale} />

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Pair</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {rate.effectiveAt.toLocaleString()}
                </TableCell>
                <TableCell>
                  {rate.baseCurrency} / {rate.targetCurrency}
                </TableCell>
                <TableCell>{rate.rate.toString()}</TableCell>
                <TableCell>{rate.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
