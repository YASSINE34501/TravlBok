import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { GlobalSettingsForm } from "@/components/admin/global-settings-form";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");

  const setting = await prisma.globalSetting.findUnique({ where: { key: "platform" } });
  const value = (setting?.value as {
    defaultLocale?: string;
    defaultCurrency?: string;
    maintenanceMode?: boolean;
  }) ?? {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("settings")}</h1>
      <GlobalSettingsForm
        locale={locale}
        initialValue={{
          defaultLocale: value.defaultLocale ?? "en",
          defaultCurrency: value.defaultCurrency ?? "MAD",
          maintenanceMode: value.maintenanceMode ?? false,
        }}
      />
    </div>
  );
}
