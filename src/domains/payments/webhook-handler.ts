import "server-only";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { syncReservationPaymentSnapshot } from "./sync";
import { notifyUser, notifyOrganizationOwners } from "@/domains/notifications/service";
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
    const reservation = await prisma.reservation.findUnique({ where: { id: updated.reservationId } });
    if (reservation && (newStatus === "PAID" || newStatus === "FAILED")) {
      await notifyUser({
        userId: reservation.customerUserId,
        type: newStatus === "PAID" ? "payment_confirmed" : "payment_failed",
        title: newStatus === "PAID" ? "Payment confirmed" : "Payment failed",
        message:
          newStatus === "PAID"
            ? `Your payment for booking ${reservation.bookingReference} was confirmed.`
            : `Your payment for booking ${reservation.bookingReference} failed. Please try again.`,
        titleKey: newStatus === "PAID" ? "paymentConfirmedTitle" : "paymentFailedTitle",
        messageKey: newStatus === "PAID" ? "paymentConfirmedMessage" : "paymentFailedMessage",
        params: { reference: reservation.bookingReference },
        metadata: { paymentId: updated.id, reservationId: reservation.id },
        channels: ["IN_APP", "EMAIL"],
      });
    }
  }
  if (newStatus === "PAID" && updated.subscriptionId) {
    await prisma.subscription.update({
      where: { id: updated.subscriptionId },
      data: { status: "ACTIVE" },
    });
    if (updated.organizationId) {
      await notifyOrganizationOwners(updated.organizationId, {
        type: "subscription_payment_confirmed",
        title: "Subscription payment confirmed",
        message: "Your subscription payment was confirmed and your plan is active.",
        titleKey: "subscriptionPaymentConfirmedTitle",
        messageKey: "subscriptionPaymentConfirmedMessage",
        metadata: { subscriptionId: updated.subscriptionId },
        channels: ["IN_APP", "EMAIL"],
      });
    }
  }
  if (newStatus === "FAILED" && updated.subscriptionId) {
    await prisma.subscription.update({
      where: { id: updated.subscriptionId },
      data: { status: "PAST_DUE" },
    });
    if (updated.organizationId) {
      await notifyOrganizationOwners(updated.organizationId, {
        type: "subscription_payment_failed",
        title: "Subscription payment failed",
        message: "Your subscription payment failed. Your account is now past due — please update your payment method.",
        titleKey: "subscriptionPaymentFailedTitle",
        messageKey: "subscriptionPaymentFailedMessage",
        metadata: { subscriptionId: updated.subscriptionId },
        channels: ["IN_APP", "EMAIL"],
      });
    }
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
