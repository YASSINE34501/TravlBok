import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function BranchesListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Partner");
  const { organization } = await getPartnerContext(locale);

  const branches = await prisma.carBranch.findMany({
    where: { organizationId: organization.id, deletedAt: null },
    include: { city: true, vehicles: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("branches")}</h1>
        <Button render={<Link href="/dashboard/branches/new" />}>
          <Plus className="size-4" />
          {t("addBranch")}
        </Button>
      </div>

      {branches.length === 0 ? (
        <p className="text-muted-foreground">{t("noBranchesYet")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Link key={branch.id} href={`/dashboard/branches/${branch.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="space-y-2 py-5">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{branch.name}</p>
                    {branch.isMainBranch && <Badge variant="secondary">Main</Badge>}
                  </div>
                  {branch.city && (
                    <p className="text-sm text-muted-foreground">
                      {pickLocaleText(branch.city.name as Record<string, unknown>, locale)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {branch.vehicles.length} vehicle(s)
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
