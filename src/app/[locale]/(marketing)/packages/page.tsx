import type { Metadata } from "next";
import { Package } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui/empty-state";
import { buildLocaleAlternates } from "@/lib/seo/alternates";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Packages" });
  return { title: t("title"), alternates: buildLocaleAlternates(locale, "/packages") };
}

export default async function PackagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Packages");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <EmptyState
        icon={Package}
        title={t("notConnectedTitle")}
        description={t("notConnectedDescription")}
        className="mt-8"
      />
    </main>
  );
}
