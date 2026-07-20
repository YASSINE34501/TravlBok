import "server-only";
import { cookies } from "next/headers";
import {
  CURRENCY_COOKIE_NAME,
  CURRENCIES,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "@/lib/currency/config";

export async function getPreferredCurrency(): Promise<CurrencyCode> {
  const store = await cookies();
  const value = store.get(CURRENCY_COOKIE_NAME)?.value;

  if (value && (CURRENCIES as readonly string[]).includes(value)) {
    return value as CurrencyCode;
  }

  return DEFAULT_CURRENCY;
}
