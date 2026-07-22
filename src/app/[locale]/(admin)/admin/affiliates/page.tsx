import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommissionDecisionActions } from "@/components/admin/commission-decision-actions";

export default async function AdminAffiliatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");

  const [affiliates, pendingCommissions] = await Promise.all([
    prisma.affiliate.findMany({
      include: {
        organization: true,
        _count: { select: { clicks: true, commissions: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.commission.findMany({
      where: { status: "PENDING" },
      include: { affiliate: { include: { organization: true } }, reservation: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("affiliates")}</h1>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">Affiliates</h2>
        <div className="mt-2 space-y-2">
          {affiliates.map((affiliate) => (
            <Card key={affiliate.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span>
                  {affiliate.organization.displayName} · {affiliate.referralCode}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{affiliate.organization.verificationStatus}</Badge>
                  <span className="text-muted-foreground">
                    {affiliate._count.clicks} clicks · {affiliate._count.commissions} conversions
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">
          Pending commissions ({pendingCommissions.length})
        </h2>
        <div className="mt-2 space-y-2">
          {pendingCommissions.map((commission) => (
            <Card key={commission.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {commission.affiliate.organization.displayName} ·{" "}
                  {formatMoney(commission.amount.toString(), commission.currency, locale)} ·{" "}
                  {commission.reservation.bookingReference}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommissionDecisionActions locale={locale} commissionId={commission.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
