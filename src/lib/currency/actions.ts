"use server";

import { cookies } from "next/headers";
import { CURRENCY_COOKIE_NAME, type CurrencyCode } from "@/lib/currency/config";

export async function setCurrencyAction(currency: CurrencyCode) {
  const store = await cookies();
  store.set(CURRENCY_COOKIE_NAME, currency, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
