import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { getProvider } from "./providers/registry";
import { syncReservationPaymentSnapshot } from "./sync";
import type { PaymentProviderCode, Reservation } from "@/generated/prisma/client";

export function generateInvoiceNumber(): string {
  return `INV-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

/**
 * For charges that aren't the original booking breakdown (e.g. PMS
 * check-out extra charges) — a standalone Payment + single-line Invoice,
 * not routed through createBookingPaymentAndInvoice's full base/tax/fee/
 * discount/commission line-item reconstruction.
 */
export async function createAdHocPaymentAndInvoice(
  reservation: Reservation,
  amount: number,
  description: string,
  providerCode: PaymentProviderCode
) {
  const provider = getProvider(providerCode);
  const intent = await provider.createPaymentIntent({
    amount,
    currency: reservation.currency,
    reservationId: reservation.id,
    description,
    customerEmail: reservation.guestEmail,
  });

  const payment = await prisma.payment.create({
    data: {
      organizationId: reservation.organizationId,
      reservationId: reservation.id,
      provider: providerCode,
      providerReference: intent.providerReference,
      status: intent.status,
      amount,
      currency: reservation.currency,
      capturedAmount: intent.status === "PAID" ? amount : 0,
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      type: "BOOKING",
      organizationId: reservation.organizationId,
      paymentId: payment.id,
      status: intent.status === "PAID" ? "PAID" : "ISSUED",
      currency: reservation.currency,
      subtotalAmount: amount,
      totalAmount: amount,
      issuedAt: new Date(),
      billingSnapshot: {
        guestName: `${reservation.guestFirstName} ${reservation.guestLastName}`,
        guestEmail: reservation.guestEmail,
        bookingReference: reservation.bookingReference,
      },
      lineItems: { create: [{ description, amount, unitAmount: amount, kind: "EXTRA" }] },
    },
  });

  await syncReservationPaymentSnapshot(payment);

  return { payment, invoice };
}

/**
 * Called right after a Reservation row is created (both hotel and car
 * booking flows), outside the booking's own DB transaction — a provider
 * call may hit the network and shouldn't hold a Serializable transaction
 * open. Creates the real Payment + Invoice ledger rows for the booking and
 * mirrors the resulting status back onto Reservation.paymentStatus.
 */
export async function createBookingPaymentAndInvoice(
  reservation: Reservation,
  providerCode: PaymentProviderCode
) {
  const provider = getProvider(providerCode);
  const intent = await provider.createPaymentIntent({
    amount: Number(reservation.totalAmount),
    currency: reservation.currency,
    reservationId: reservation.id,
    description: `TravlBok booking ${reservation.bookingReference}`,
    customerEmail: reservation.guestEmail,
  });

  const payment = await prisma.payment.create({
    data: {
      organizationId: reservation.organizationId,
      reservationId: reservation.id,
      provider: providerCode,
      providerReference: intent.providerReference,
      status: intent.status,
      amount: reservation.totalAmount,
      currency: reservation.currency,
      capturedAmount: intent.status === "PAID" ? reservation.totalAmount : 0,
    },
  });

  const lineItems = [
    {
      description: "Base price",
      amount: reservation.basePriceAmount,
      unitAmount: reservation.basePriceAmount,
      kind: "BASE",
    },
    ...(Number(reservation.taxAmount) > 0
      ? [
          {
            description: "Taxes",
            amount: reservation.taxAmount,
            unitAmount: reservation.taxAmount,
            kind: "TAX",
          },
        ]
      : []),
    ...(Number(reservation.feeAmount) > 0
      ? [
          {
            description: "Fees",
            amount: reservation.feeAmount,
            unitAmount: reservation.feeAmount,
            kind: "FEE",
          },
        ]
      : []),
    ...(Number(reservation.discountAmount) > 0
      ? [
          {
            description: "Discount",
            amount: Number(reservation.discountAmount) * -1,
            unitAmount: Number(reservation.discountAmount) * -1,
            kind: "DISCOUNT",
          },
        ]
      : []),
    {
      description: "Platform commission (informational, not an additional guest charge)",
      amount: reservation.commissionAmount,
      unitAmount: reservation.commissionAmount,
      kind: "COMMISSION",
    },
  ];

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      type: "BOOKING",
      organizationId: reservation.organizationId,
      reservationId: reservation.id,
      paymentId: payment.id,
      status: intent.status === "PAID" ? "PAID" : "ISSUED",
      currency: reservation.currency,
      subtotalAmount: reservation.basePriceAmount,
      taxAmount: reservation.taxAmount,
      feeAmount: reservation.feeAmount,
      discountAmount: reservation.discountAmount,
      commissionAmount: reservation.commissionAmount,
      totalAmount: reservation.totalAmount,
      issuedAt: new Date(),
      billingSnapshot: {
        guestName: `${reservation.guestFirstName} ${reservation.guestLastName}`,
        guestEmail: reservation.guestEmail,
        bookingReference: reservation.bookingReference,
      },
      lineItems: { create: lineItems },
    },
  });

  await syncReservationPaymentSnapshot(payment);

  return { payment, invoice };
}
