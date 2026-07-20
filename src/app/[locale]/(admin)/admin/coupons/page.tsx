import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateCouponForm } from "@/components/admin/create-coupon-form";
import { ToggleCouponButton } from "@/components/admin/toggle-coupon-button";

export default async function AdminCouponsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("coupons")}</h1>
      <CreateCouponForm locale={locale} />

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-medium">{coupon.code}</TableCell>
                <TableCell>
                  {coupon.value.toString()}
                  {coupon.type === "PERCENTAGE" ? "%" : ` ${coupon.currency ?? ""}`}
                </TableCell>
                <TableCell>{coupon.scope}</TableCell>
                <TableCell>
                  {coupon.usageCount}
                  {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                </TableCell>
                <TableCell>
                  <Badge variant={coupon.status === "ACTIVE" ? "secondary" : "outline"}>
                    {coupon.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-end">
                  <ToggleCouponButton
                    locale={locale}
                    couponId={coupon.id}
                    status={coupon.status}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
