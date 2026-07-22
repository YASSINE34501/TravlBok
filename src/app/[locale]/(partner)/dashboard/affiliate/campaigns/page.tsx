import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { CreateCampaignForm } from "@/components/partner/create-campaign-form";
import { ToggleCampaignButton } from "@/components/partner/toggle-campaign-button";
import { CampaignQrCode } from "@/components/partner/campaign-qr-code";

export default async function AffiliateCampaignsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Partner");
  const { organization } = await getPartnerContext(locale);

  const affiliate = await prisma.affiliate.findUniqueOrThrow({
    where: { organizationId: organization.id },
  });
  const campaigns = await prisma.campaign.findMany({
    where: { affiliateId: affiliate.id },
    include: { _count: { select: { clicks: true } } },
    orderBy: { createdAt: "desc" },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("affiliateCampaigns")}</h1>
      <CreateCampaignForm locale={locale} organizationId={organization.id} />

      <div className="space-y-3">
        {campaigns.map((campaign) => {
          const link = `${appUrl}/${locale}/r/${affiliate.referralCode}?camp=${campaign.slug}`;
          return (
            <div key={campaign.id} className="flex items-center gap-4 rounded-md border p-3">
              <CampaignQrCode url={link} />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{campaign.name}</span>
                  <Badge variant={campaign.isActive ? "default" : "secondary"}>
                    {campaign.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <code className="block text-xs text-muted-foreground">{link}</code>
                <p className="text-xs text-muted-foreground">
                  {campaign._count.clicks} clicks
                </p>
              </div>
              <ToggleCampaignButton
                locale={locale}
                organizationId={organization.id}
                campaignId={campaign.id}
                isActive={campaign.isActive}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
