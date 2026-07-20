import "server-only";
import { prisma } from "@/lib/db";
import type { ReservationType } from "@/generated/prisma/client";

export async function resolveCoupon(
  code: string | undefined,
  scope: ReservationType,
  organizationId: string,
  amount: number
): Promise<{ couponId: string | null; discountAmount: number; error?: string }> {
  if (!code) return { couponId: null, discountAmount: 0 };

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || coupon.status !== "ACTIVE") {
    return { couponId: null, discountAmount: 0, error: "invalidCoupon" };
  }

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validTo) {
    return { couponId: null, discountAmount: 0, error: "expiredCoupon" };
  }
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    return { couponId: null, discountAmount: 0, error: "couponLimitReached" };
  }
  if (coupon.scope !== "ALL" && coupon.scope !== scope) {
    return { couponId: null, discountAmount: 0, error: "invalidCoupon" };
  }
  if (coupon.organizationId && coupon.organizationId !== organizationId) {
    return { couponId: null, discountAmount: 0, error: "invalidCoupon" };
  }
  if (coupon.minBookingAmount != null && amount < Number(coupon.minBookingAmount)) {
    return { couponId: null, discountAmount: 0, error: "minAmountNotMet" };
  }

  let discount =
    coupon.type === "PERCENTAGE" ? amount * (Number(coupon.value) / 100) : Number(coupon.value);

  if (coupon.maxDiscount != null) {
    discount = Math.min(discount, Number(coupon.maxDiscount));
  }
  discount = Math.min(discount, amount);

  return { couponId: coupon.id, discountAmount: Math.round(discount * 100) / 100 };
}

export async function getCommissionRate(
  organizationId: string,
  serviceType: ReservationType
): Promise<number> {
  const orgRule = await prisma.commissionRule.findFirst({
    where: { organizationId, serviceType },
    orderBy: { createdAt: "desc" },
  });
  const rule =
    orgRule ??
    (await prisma.commissionRule.findFirst({
      where: { organizationId: null, serviceType },
      orderBy: { createdAt: "desc" },
    }));

  if (!rule) return 0.1; // sensible platform default: 10%
  return rule.type === "PERCENTAGE" ? Number(rule.value) / 100 : Number(rule.value);
}
