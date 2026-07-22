"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrganizationAccess, requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getProvider } from "./providers/registry";
import { syncReservationPaymentSnapshot } from "./sync";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Staff-confirmed payments (Bank transfer / Manual / Cash at property don't
 * clear automatically — a human confirms the money actually arrived).
 */
export async function confirmPaymentReceivedAction(
  locale: string,
  organizationId: string,
  paymentId: string
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, [
    ...ROLE_GROUPS.partnerOwners,
    ...ROLE_GROUPS.hotelStaff,
    ...ROLE_GROUPS.carRentalStaff,
  ]);

  const payment = await prisma.payment.findFirst({ where: { id: paymentId, organizationId } });
  if (!payment) return { success: false, error: "notFound" };

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "PAID", capturedAmount: payment.amount },
  });

  if (updated.reservationId) {
    await syncReservationPaymentSnapshot(updated);
  }
  const invoice = await prisma.invoice.findUnique({ where: { paymentId } });
  if (invoice) {
    await prisma.invoice.update({ where: { paymentId }, data: { status: "PAID" } });
  }

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "payment.confirm",
    entityType: "Payment",
    entityId: paymentId,
  });

  revalidatePath(`/${locale}/dashboard/payments`);
  return { success: true };
}

export async function requestRefundAction(
  locale: string,
  organizationId: string,
  paymentId: string,
  amount: number,
  reason?: string
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, [
    ...ROLE_GROUPS.partnerOwners,
    ...ROLE_GROUPS.hotelStaff,
    ...ROLE_GROUPS.carRentalStaff,
  ]);

  const payment = await prisma.payment.findFirst({ where: { id: paymentId, organizationId } });
  if (!payment || payment.status !== "PAID") {
    return { success: false, error: "invalidInput" };
  }

  const provider = getProvider(payment.provider);
  const result = await provider.refund({
    paymentId: payment.id,
    providerReference: payment.providerReference ?? "",
    amount,
    reason,
  });

  await prisma.refund.create({
    data: {
      paymentId,
      amount,
      reason: reason ?? null,
      status: result.status,
      providerRefundReference: result.providerRefundReference,
      initiatedByUserId: user.id,
      processedAt: result.status === "COMPLETED" ? new Date() : null,
    },
  });

  if (result.status === "COMPLETED") {
    const fullyRefunded = amount >= Number(payment.amount);
    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED" },
    });
    if (updated.reservationId) {
      await syncReservationPaymentSnapshot(updated);
      await prisma.reservation.update({
        where: { id: updated.reservationId },
        data: { status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED" },
      });
    }
  }

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "payment.refund",
    entityType: "Payment",
    entityId: paymentId,
    metadata: { amount, status: result.status },
  });

  revalidatePath(`/${locale}/dashboard/payments`);
  return { success: true };
}

export async function voidInvoiceAction(
  locale: string,
  invoiceId: string
): Promise<ActionResult> {
  const admin = await requireRole(locale, ROLE_GROUPS.platformStaff);
  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "VOID" } });
  await logAudit({
    actorUserId: admin.id,
    action: "admin.invoice.void",
    entityType: "Invoice",
    entityId: invoiceId,
  });
  revalidatePath(`/${locale}/admin/invoices`);
  return { success: true };
}
