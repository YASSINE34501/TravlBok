import "server-only";
import { getPreferredCurrency } from "@/lib/currency/cookie";
import { getLatestExchangeRates, convertAmount } from "@/lib/currency/exchange";
import { formatMoney } from "@/lib/currency/format";
import type { CurrencyCode } from "@/lib/currency/config";

export async function getDisplayCurrencyContext() {
  const [currency, rates] = await Promise.all([
    getPreferredCurrency(),
    getLatestExchangeRates(),
  ]);
  return { currency, rates };
}

export function formatFromBase(
  amount: number | string,
  amountCurrency: CurrencyCode,
  displayCurrency: CurrencyCode,
  rates: Record<CurrencyCode, number>,
  locale: string
): string {
  const numericAmount = typeof amount === "string" ? Number(amount) : amount;
  const converted = convertAmount(numericAmount, amountCurrency, displayCurrency, rates);
  return formatMoney(converted, displayCurrency, locale);
}
