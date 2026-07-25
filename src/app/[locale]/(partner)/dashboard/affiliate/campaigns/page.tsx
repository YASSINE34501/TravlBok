import { getTranslations } from "next-intl/server";
import { Link2 } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { DataTableShell } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
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
      <PageHeader title={t("affiliateCampaigns")} />
      <CreateCampaignForm locale={locale} organizationId={organization.id} />

      {campaigns.length === 0 ? (
        <EmptyState icon={Link2} title="No campaigns yet" />
      ) : (
        <DataTableShell>
          <div className="divide-y">
            {campaigns.map((campaign) => {
              const link = `${appUrl}/${locale}/r/${affiliate.referralCode}?camp=${campaign.slug}`;
              return (
                <div key={campaign.id} className="flex items-center gap-4 px-4 py-4 sm:px-5">
                  <CampaignQrCode url={link} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{campaign.name}</span>
                      <StatusBadge tone={campaign.isActive ? "success" : "neutral"}>
                        {campaign.isActive ? "Active" : "Inactive"}
                      </StatusBadge>
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
        </DataTableShell>
      )}
    </div>
  );
}
