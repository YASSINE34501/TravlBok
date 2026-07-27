export const CURRENCIES = [
  "MAD",
  "EUR",
  "USD",
  "GBP",
  "CAD",
  "CHF",
  "AED",
  "SAR",
  "QAR",
  "KWD",
  "JPY",
  "CNY",
  "AUD",
  "NZD",
  "TRY",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "BRL",
  "INR",
  "MXN",
  "SGD",
  "HKD",
] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "MAD";

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  MAD: "DH",
  EUR: "€",
  USD: "$",
  GBP: "£",
  CAD: "CA$",
  CHF: "CHF",
  AED: "AED",
  SAR: "SAR",
  QAR: "QAR",
  KWD: "KWD",
  JPY: "¥",
  CNY: "CN¥",
  AUD: "A$",
  NZD: "NZ$",
  TRY: "₺",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  BRL: "R$",
  INR: "₹",
  MXN: "MX$",
  SGD: "S$",
  HKD: "HK$",
};

export const CURRENCY_LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  ar: "ar-MA",
};

export const CURRENCY_COOKIE_NAME = "TRAVLBOK_CURRENCY";

// Value->label map for shadcn/Base UI Select's `items` prop (needed for the
// trigger to display a label instead of the raw value — see travlbok-stack-gotchas).
export const CURRENCY_SELECT_ITEMS: Record<CurrencyCode, string> = Object.fromEntries(
  CURRENCIES.map((code) => [code, code])
) as Record<CurrencyCode, string>;
