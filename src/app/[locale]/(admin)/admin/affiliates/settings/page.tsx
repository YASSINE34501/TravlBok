import { getTranslations } from "next-intl/server";
import { getAffiliateSettings } from "@/domains/affiliates/rate";
import { AffiliateSettingsForm } from "@/components/admin/affiliate-settings-form";

export default async function AdminAffiliateSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");
  const settings = await getAffiliateSettings();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("affiliateSettings")}</h1>
      <AffiliateSettingsForm locale={locale} settings={settings} />
    </div>
  );
}
