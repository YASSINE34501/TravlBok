import "server-only";
import { prisma } from "@/lib/db";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currency/config";

/**
 * Returns the latest known rate for each currency expressed as
 * "amount of MAD equal to 1 unit of that currency" (MAD itself is always 1).
 */
export async function getLatestExchangeRates(): Promise<
  Record<CurrencyCode, number>
> {
  const rates: Record<CurrencyCode, number> = { MAD: 1, EUR: 1, USD: 1 };

  const results = await prisma.exchangeRate.findMany({
    where: { baseCurrency: DEFAULT_CURRENCY },
    orderBy: { effectiveAt: "desc" },
    distinct: ["targetCurrency"],
  });

  for (const result of results) {
    rates[result.targetCurrency] = Number(result.rate);
  }

  return rates;
}

export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  ratesToMad: Record<CurrencyCode, number>
): number {
  if (from === to) return amount;

  const amountInMad = from === DEFAULT_CURRENCY ? amount : amount * ratesToMad[from];
  const converted =
    to === DEFAULT_CURRENCY ? amountInMad : amountInMad / ratesToMad[to];

  return Math.round(converted * 100) / 100;
}
