import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { PromoMaterialsManager } from "@/components/partner/promo-materials-manager";

export default async function AffiliatePromoMaterialsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Partner");
  const { organization } = await getPartnerContext(locale);

  const files = await prisma.uploadedFile.findMany({
    where: { organizationId: organization.id, purpose: "PROMO_MATERIAL" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t("affiliatePromoMaterials")} />
      <PromoMaterialsManager
        locale={locale}
        organizationId={organization.id}
        existing={files.map((f) => ({ id: f.id, url: f.url }))}
      />
    </div>
  );
}
