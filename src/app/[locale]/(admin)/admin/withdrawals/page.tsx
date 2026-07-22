import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency/format";
import { Badge } from "@/components/ui/badge";
import { WithdrawalDecisionActions } from "@/components/admin/withdrawal-decision-actions";

export default async function AdminWithdrawalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const withdrawals = await prisma.withdrawal.findMany({
    include: { affiliate: { include: { organization: true } } },
    orderBy: { requestedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Withdrawals</h1>

      <div className="space-y-2">
        {withdrawals.map((withdrawal) => (
          <div
            key={withdrawal.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <span>
              {withdrawal.affiliate.organization.displayName} ·{" "}
              {formatMoney(withdrawal.amount.toString(), withdrawal.currency, locale)} ·{" "}
              {withdrawal.requestedAt.toDateString()}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={withdrawal.status === "PAID" ? "default" : "secondary"}>
                {withdrawal.status}
              </Badge>
              <WithdrawalDecisionActions
                locale={locale}
                withdrawalId={withdrawal.id}
                status={withdrawal.status}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
