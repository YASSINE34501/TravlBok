import "server-only";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import type { BookingStatus } from "@/generated/prisma/client";

/**
 * Hooked into cancelReservationAction/updatePartnerReservationStatusAction.
 * PENDING/APPROVED commissions are auto-cancelled on booking cancellation.
 * Already-PAID commissions are never auto-reversed — clawing back money
 * already sent to an affiliate is a human decision, flagged for admin
 * review instead.
 */
export async function handleReservationStatusChangeForCommission(
  reservationId: string,
  newStatus: BookingStatus
): Promise<void> {
  if (newStatus !== "CANCELLED" && newStatus !== "REFUNDED" && newStatus !== "PARTIALLY_REFUNDED") {
    return;
  }

  const commission = await prisma.commission.findUnique({ where: { reservationId } });
  if (!commission) return;

  if (commission.status === "PENDING" || commission.status === "APPROVED") {
    await prisma.commission.update({
      where: { id: commission.id },
      data: { status: "CANCELLED" },
    });
    await logAudit({
      action: "affiliate.commission.auto_cancelled",
      entityType: "Commission",
      entityId: commission.id,
      metadata: { reservationId, reservationStatus: newStatus },
    });
  } else if (commission.status === "PAID") {
    await logAudit({
      action: "affiliate.commission.paid_but_booking_cancelled_review_needed",
      entityType: "Commission",
      entityId: commission.id,
      metadata: { reservationId, reservationStatus: newStatus },
    });
  }
}
