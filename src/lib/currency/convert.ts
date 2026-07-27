import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currency/config";

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
