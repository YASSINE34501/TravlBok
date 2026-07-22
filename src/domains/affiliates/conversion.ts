import "server-only";
import { cookies } from "next/headers";
import { logAudit } from "@/lib/audit";
import { getAffiliateCommissionRate, getAffiliateSettings } from "./rate";
import type { Prisma, Reservation } from "@/generated/prisma/client";

export const AFFILIATE_REF_COOKIE = "TRAVLBOK_REF";

type RefCookiePayload = {
  affiliateId: string;
  campaignId?: string;
  clickId?: string;
};

/**
 * Called from inside the same $transaction that creates a Reservation (both
 * hotel and car booking flows), right after the Reservation row exists.
 * Resolves the TRAVLBOK_REF cookie set by the /r/[code] redirect route,
 * blocks self-referrals, and creates a PENDING Commission.
 * Commission.reservationId is @unique, so double-crediting a single
 * booking is impossible at the DB level even if this were called twice.
 */
export async function recordAffiliateConversion(
  tx: Prisma.TransactionClient,
  reservation: Reservation
): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(AFFILIATE_REF_COOKIE)?.value;
  if (!raw) return;

  let ref: RefCookiePayload;
  try {
    ref = JSON.parse(raw);
  } catch {
    return;
  }
  if (!ref.affiliateId) return;

  const affiliate = await tx.affiliate.findUnique({
    where: { id: ref.affiliateId },
    include: { organization: true },
  });
  if (!affiliate || affiliate.organization.verificationStatus !== "APPROVED") return;

  const selfReferral = await tx.organizationMember.findFirst({
    where: { organizationId: affiliate.organizationId, userId: reservation.customerUserId },
  });
  if (selfReferral) {
    await logAudit({
      organizationId: affiliate.organizationId,
      action: "affiliate.self_referral_blocked",
      entityType: "Reservation",
      entityId: reservation.id,
      metadata: { affiliateId: affiliate.id },
    });
    return;
  }

  const rate = await getAffiliateCommissionRate(reservation.organizationId, reservation.type);
  if (rate <= 0) return;

  const settings = await getAffiliateSettings();
  const holdingDays = affiliate.holdingPeriodDays ?? settings.holdingPeriodDays;
  const holdReleaseAt = new Date();
  holdReleaseAt.setDate(holdReleaseAt.getDate() + holdingDays);

  const amount = Math.round(Number(reservation.totalAmount) * rate * 100) / 100;

  await tx.commission.create({
    data: {
      affiliateId: affiliate.id,
      reservationId: reservation.id,
      clickId: ref.clickId ?? null,
      amount,
      currency: reservation.currency,
      rateSnapshot: rate,
      status: "PENDING",
      holdReleaseAt,
    },
  });

  if (ref.clickId) {
    await tx.affiliateClick.update({
      where: { id: ref.clickId },
      data: { convertedReservationId: reservation.id },
    });
  }
}
