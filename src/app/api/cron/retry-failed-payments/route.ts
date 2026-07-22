import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getProvider } from "@/domains/payments/providers/registry";
import { syncReservationPaymentSnapshot } from "@/domains/payments/sync";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

const MAX_RETRIES = 3;
const RETRY_BACKOFF_HOURS = [1, 6, 24];

/**
 * Meant to be invoked periodically by an external scheduler (Vercel Cron /
 * OS cron), guarded by a shared secret — intentionally not a Redis/BullMQ
 * queue. Full job-queue infrastructure is Phase 3 "Performance and
 * Scalability" scope, not required here.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const duePayments = await prisma.payment.findMany({
    where: {
      status: "FAILED",
      retryCount: { lt: MAX_RETRIES },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    take: 50,
  });

  const results: { paymentId: string; outcome: string }[] = [];

  for (const payment of duePayments) {
    const provider = getProvider(payment.provider);
    try {
      const intent = await provider.createPaymentIntent({
        amount: Number(payment.amount),
        currency: payment.currency,
        reservationId: payment.reservationId ?? undefined,
        subscriptionId: payment.subscriptionId ?? undefined,
        description: `Retry for payment ${payment.id}`,
        customerEmail: "",
      });

      const nextRetryAt = new Date();
      nextRetryAt.setHours(
        nextRetryAt.getHours() + (RETRY_BACKOFF_HOURS[payment.retryCount] ?? 24)
      );

      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: intent.status,
          providerReference: intent.providerReference,
          retryCount: { increment: 1 },
          nextRetryAt: intent.status === "PAID" ? null : nextRetryAt,
        },
      });

      if (updated.reservationId) {
        await syncReservationPaymentSnapshot(updated);
      }

      results.push({ paymentId: payment.id, outcome: intent.status });
    } catch {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { retryCount: { increment: 1 } },
      });
      results.push({ paymentId: payment.id, outcome: "retry_error" });
    }
  }

  await logAudit({
    action: "payment.retry_job.run",
    entityType: "Payment",
    metadata: { count: results.length },
  });

  return NextResponse.json({ processed: results.length, results });
}
