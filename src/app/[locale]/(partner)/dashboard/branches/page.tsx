import { getTranslations } from "next-intl/server";
import { Plus, MapPinned } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { formatMoney } from "@/lib/currency/format";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getScopedBranchId } from "@/domains/branches/access";
import { getBranchPerformance } from "@/domains/branches/queries";

export default async function BranchesListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Partner");
  const { user, membership, organization } = await getPartnerContext(locale);

  const scopedBranchId = await getScopedBranchId(organization.id, user.id, membership.role);

  const [allBranches, performance] = await Promise.all([
    prisma.carBranch.findMany({
      where: { organizationId: organization.id, deletedAt: null },
      include: { city: true, vehicles: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getBranchPerformance(organization.id),
  ]);
  const branches = scopedBranchId ? allBranches.filter((b) => b.id === scopedBranchId) : allBranches;
  const performanceById = new Map(performance.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("branches")}
        actions={
          <Button render={<Link href="/dashboard/branches/new" />}>
            <Plus className="size-4" />
            {t("addBranch")}
          </Button>
        }
      />

      {branches.length === 0 ? (
        <EmptyState icon={MapPinned} title={t("noBranchesYet")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Link key={branch.id} href={`/dashboard/branches/${branch.id}`} className="group block">
              <Card className="rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{branch.name}</p>
                    {branch.isMainBranch && <StatusBadge tone="info">Main</StatusBadge>}
                  </div>
                  {branch.city && (
                    <p className="text-sm text-muted-foreground">
                      {pickLocaleText(branch.city.name as Record<string, unknown>, locale)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {branch.vehicles.length} vehicle(s) ·{" "}
                    {performanceById.get(branch.id)?.utilizationPercent ?? 0}% utilization
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Revenue:{" "}
                    {formatMoney(
                      String(performanceById.get(branch.id)?.revenue ?? 0),
                      organization.baseCurrency,
                      locale
                    )}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
