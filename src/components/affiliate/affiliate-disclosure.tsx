import { getTranslations } from "next-intl/server";
import { Info } from "lucide-react";

/**
 * Small, unobtrusive affiliate-disclosure line for public marketing
 * surfaces. Mounted once in the marketing footer (`src/components/layout/footer.tsx`)
 * rather than repeated per-page — it is site-wide by nature, not tied to
 * any single listing or offer.
 */
export async function AffiliateDisclosure({ className }: { className?: string }) {
  const t = await getTranslations("AffiliateDisclosure");
  return (
    <p className={`flex items-start gap-1.5 text-xs text-muted-foreground ${className ?? ""}`}>
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{t("text")}</span>
    </p>
  );
}
