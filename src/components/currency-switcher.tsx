"use client";

import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CURRENCIES } from "@/lib/currency/config";
import { useCurrency } from "@/components/currency-provider";

export function CurrencySwitcher() {
  const t = useTranslations("Currency");
  const { currency, setCurrency } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="gap-1" />}>
        {currency}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {CURRENCIES.map((code) => (
          <DropdownMenuItem
            key={code}
            data-active={code === currency}
            onClick={() => setCurrency(code)}
          >
            <span className="font-medium">{code}</span>
            <span className="ms-2 text-muted-foreground">{t(code)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
