"use client";

import { useLocale, useTranslations } from "next-intl";
import { Globe, ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import { setUserLocaleAction } from "@/lib/i18n/actions";

export function LanguageSwitcher() {
  const t = useTranslations("Locale");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  // next-intl's `usePathname()` deliberately excludes the query string, so
  // switching locale with just `router.replace(pathname, { locale })` would
  // silently drop any active search/filter/sort/page state — read it back
  // from the plain (non-locale-aware) `useSearchParams()` and carry it
  // through the locale switch.
  const searchParams = useSearchParams();

  function handleSelect(nextLocale: (typeof locales)[number]) {
    const query = Object.fromEntries(searchParams.entries());
    router.replace({ pathname, query }, { locale: nextLocale });
    void setUserLocaleAction(nextLocale);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="gap-1.5" />}
        aria-label={t(locale as "en" | "fr" | "ar")}
      >
        <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium uppercase">{locale}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((code) => (
          <DropdownMenuItem key={code} onClick={() => handleSelect(code)}>
            {t(code)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
