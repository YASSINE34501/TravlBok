import { getTranslations } from "next-intl/server";
import { Compass } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * Locale-scoped 404 boundary — catches `notFound()` calls from any page
 * under `[locale]/*` that doesn't have its own more specific `not-found.tsx`
 * (e.g. the partner dashboard's), and unmatched routes within a locale.
 * Previously absent app-wide except for the partner dashboard, so every
 * other 404 fell through to Next's generic unbranded default.
 */
export default async function LocaleNotFound() {
  const t = await getTranslations("NotFound");

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Compass className="size-7" />
      </span>
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <Button render={<Link href="/" />}>{t("backHome")}</Button>
    </main>
  );
}
