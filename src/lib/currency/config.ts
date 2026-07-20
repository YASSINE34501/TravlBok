export const CURRENCIES = ["MAD", "EUR", "USD"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "MAD";

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  MAD: "DH",
  EUR: "€",
  USD: "$",
};

export const CURRENCY_LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  ar: "ar-MA",
};

export const CURRENCY_COOKIE_NAME = "TRAVLBOK_CURRENCY";

// Value->label map for shadcn/Base UI Select's `items` prop (needed for the
// trigger to display a label instead of the raw value — see travlbok-stack-gotchas).
export const CURRENCY_SELECT_ITEMS: Record<CurrencyCode, string> = {
  MAD: "MAD",
  EUR: "EUR",
  USD: "USD",
};
