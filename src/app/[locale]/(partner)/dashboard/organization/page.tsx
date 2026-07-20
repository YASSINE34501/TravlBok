import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { OrganizationForm } from "@/components/partner/organization-form";

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Partner");
  const { organization } = await getPartnerContext(locale);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("settings")}</h1>
      <OrganizationForm
        locale={locale}
        organizationId={organization.id}
        verificationStatus={organization.verificationStatus}
        defaultValues={{
          legalName: organization.legalName,
          displayName: organization.displayName,
          registrationNumber: organization.registrationNumber ?? "",
          taxId: organization.taxId ?? "",
          address: organization.address ?? "",
          phone: organization.phone ?? "",
          email: organization.email ?? "",
          website: organization.website ?? "",
          baseCurrency: organization.baseCurrency,
        }}
      />
    </div>
  );
}
