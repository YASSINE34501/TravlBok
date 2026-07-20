"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { setCurrencyAction } from "@/lib/currency/actions";
import type { CurrencyCode } from "@/lib/currency/config";

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  isPending: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  initialCurrency,
  children,
}: {
  initialCurrency: CurrencyCode;
  children: React.ReactNode;
}) {
  const [currency, setCurrencyState] = useState(initialCurrency);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function setCurrency(next: CurrencyCode) {
    setCurrencyState(next);
    startTransition(async () => {
      await setCurrencyAction(next);
      router.refresh();
    });
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, isPending }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
