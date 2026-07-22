import "server-only";
import { prisma } from "@/lib/db";
import type { Payment, PaymentTransactionStatus, PaymentStatus } from "@/generated/prisma/client";

const STATUS_MAP: Record<PaymentTransactionStatus, PaymentStatus> = {
  PENDING: "PENDING",
  AUTHORIZED: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  CANCELLED: "FAILED",
  REFUNDED: "PAID",
  PARTIALLY_REFUNDED: "PAID",
};

/**
 * Reservation.paymentStatus stays as a denormalized fast-path snapshot read
 * throughout the booking UI and front-desk dashboard; Payment is the real
 * ledger. Call this after every Payment status change so the two never
 * drift out of sync.
 */
export async function syncReservationPaymentSnapshot(payment: Payment): Promise<void> {
  if (!payment.reservationId) return;
  await prisma.reservation.update({
    where: { id: payment.reservationId },
    data: { paymentStatus: STATUS_MAP[payment.status] },
  });
}
