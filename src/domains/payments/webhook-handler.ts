import "server-only";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { syncReservationPaymentSnapshot } from "./sync";
import type { WebhookEvent } from "./providers/types";
import type { PaymentTransactionStatus } from "@/generated/prisma/client";

const EVENT_STATUS_TO_PAYMENT_STATUS: Record<
  NonNullable<WebhookEvent["status"]>,
  PaymentTransactionStatus
> = {
  PENDING: "PENDING",
  AUTHORIZED: "AUTHORIZED",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
};

export async function handlePaymentProviderEvent(event: WebhookEvent): Promise<void> {
  if (!event.status || !event.paymentProviderReference) return;

  const payment = await prisma.payment.findFirst({
    where: { providerReference: event.paymentProviderReference },
  });
  if (!payment) return;

  const newStatus = EVENT_STATUS_TO_PAYMENT_STATUS[event.status];
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: newStatus,
      capturedAmount: newStatus === "PAID" ? payment.amount : payment.capturedAmount,
    },
  });

  if (updated.reservationId) {
    await syncReservationPaymentSnapshot(updated);
  }
  if (newStatus === "PAID" && updated.subscriptionId) {
    await prisma.subscription.update({
      where: { id: updated.subscriptionId },
      data: { status: "ACTIVE" },
    });
  }
  if (newStatus === "FAILED" && updated.subscriptionId) {
    await prisma.subscription.update({
      where: { id: updated.subscriptionId },
      data: { status: "PAST_DUE" },
    });
  }
  const invoice = await prisma.invoice.findUnique({ where: { paymentId: updated.id } });
  if (invoice) {
    await prisma.invoice.update({
      where: { paymentId: updated.id },
      data: { status: newStatus === "PAID" ? "PAID" : "ISSUED" },
    });
  }

  await logAudit({
    action: "payment.webhook_update",
    entityType: "Payment",
    entityId: payment.id,
    organizationId: updated.organizationId,
    metadata: { eventType: event.type, newStatus },
  });
}
