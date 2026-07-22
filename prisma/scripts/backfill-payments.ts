import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function generateInvoiceNumber(): string {
  return `INV-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

/**
 * One-off backfill for Reservations created before the Payments milestone
 * (no Payment/Invoice row exists yet). Run once: `npx tsx prisma/scripts/backfill-payments.ts`.
 * Safe to re-run — skips any Reservation that already has a Payment.
 */
async function main() {
  const reservations = await prisma.reservation.findMany({
    where: { payments: { none: {} } },
  });

  console.log(`Backfilling payments/invoices for ${reservations.length} reservation(s)...`);

  for (const reservation of reservations) {
    const provider = reservation.paymentMethod === "PAY_AT_PROPERTY" ? "CASH_AT_PROPERTY" : "MANUAL";
    const paymentStatus =
      reservation.paymentStatus === "PAID"
        ? "PAID"
        : reservation.paymentStatus === "FAILED"
          ? "FAILED"
          : "PENDING";

    const payment = await prisma.payment.create({
      data: {
        organizationId: reservation.organizationId,
        reservationId: reservation.id,
        provider,
        status: paymentStatus,
        amount: reservation.totalAmount,
        currency: reservation.currency,
        capturedAmount: paymentStatus === "PAID" ? reservation.totalAmount : 0,
        metadata: { backfilled: true },
      },
    });

    await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        type: "BOOKING",
        organizationId: reservation.organizationId,
        reservationId: reservation.id,
        paymentId: payment.id,
        status: paymentStatus === "PAID" ? "PAID" : "ISSUED",
        currency: reservation.currency,
        subtotalAmount: reservation.basePriceAmount,
        taxAmount: reservation.taxAmount,
        feeAmount: reservation.feeAmount,
        discountAmount: reservation.discountAmount,
        commissionAmount: reservation.commissionAmount,
        totalAmount: reservation.totalAmount,
        issuedAt: reservation.createdAt,
        billingSnapshot: {
          guestName: `${reservation.guestFirstName} ${reservation.guestLastName}`,
          guestEmail: reservation.guestEmail,
          bookingReference: reservation.bookingReference,
          backfilled: true,
        },
        lineItems: {
          create: [
            {
              description: "Base price",
              amount: reservation.basePriceAmount,
              unitAmount: reservation.basePriceAmount,
              kind: "BASE",
            },
            {
              description: "Platform commission (informational)",
              amount: reservation.commissionAmount,
              unitAmount: reservation.commissionAmount,
              kind: "COMMISSION",
            },
          ],
        },
      },
    });
  }

  console.log("Backfill complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
