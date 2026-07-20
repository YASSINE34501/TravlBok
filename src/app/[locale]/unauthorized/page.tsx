import { setRequestLocale, getTranslations } from "next-intl/server";
import { ShieldAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function UnauthorizedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Errors");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <ShieldAlert className="size-12 text-destructive" />
      <h1 className="text-2xl font-semibold">{t("unauthorizedTitle")}</h1>
      <p className="max-w-md text-muted-foreground">
        {t("unauthorizedDescription")}
      </p>
      <Button render={<Link href="/" />}>{t("backHome")}</Button>
    </main>
  );
}
