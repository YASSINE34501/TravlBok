import "server-only";
import { prisma } from "@/lib/db";
import { CURRENCIES, DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currency/config";

/**
 * Returns the latest known rate for each currency expressed as
 * "amount of MAD equal to 1 unit of that currency" (MAD itself is always 1).
 * Currencies without an admin-entered rate yet default to 1 (same placeholder
 * behavior as before expansion) until a real rate is entered at /admin/exchange-rates.
 */
export async function getLatestExchangeRates(): Promise<
  Record<CurrencyCode, number>
> {
  const rates = Object.fromEntries(CURRENCIES.map((code) => [code, 1])) as Record<
    CurrencyCode,
    number
  >;

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
