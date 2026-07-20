import { CURRENCY_LOCALE_MAP, type CurrencyCode } from "@/lib/currency/config";

export function formatMoney(
  amount: number | string,
  currency: CurrencyCode,
  locale: string
): string {
  const numericAmount = typeof amount === "string" ? Number(amount) : amount;
  const intlLocale = CURRENCY_LOCALE_MAP[locale] ?? "en-US";

  try {
    return new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency,
      currencyDisplay: currency === "MAD" ? "code" : "symbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${numericAmount.toFixed(2)} ${currency}`;
  }
}

export function formatNumber(value: number | string, locale: string): string {
  const numericValue = typeof value === "string" ? Number(value) : value;
  const intlLocale = CURRENCY_LOCALE_MAP[locale] ?? "en-US";
  return new Intl.NumberFormat(intlLocale).format(numericValue);
}
