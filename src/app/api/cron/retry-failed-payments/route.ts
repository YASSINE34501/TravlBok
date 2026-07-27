import { prisma } from "@/lib/db";
import { getProvider } from "@/domains/payments/providers/registry";
import { syncReservationPaymentSnapshot } from "@/domains/payments/sync";
import { logAudit } from "@/lib/audit";
import { runCronJob } from "@/lib/cron/run";

export const runtime = "nodejs";

const MAX_RETRIES = 3;
const RETRY_BACKOFF_HOURS = [1, 6, 24];

/**
 * Invoked periodically by Vercel Cron (see vercel.json). The `runCronJob`
 * lock is the important guard here specifically: without it, two
 * overlapping invocations could both select the same "due" payment before
 * either updates it, calling `provider.createPaymentIntent` twice for one
 * payment.
 */
async function run() {
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

  return { processed: results.length, results };
}

export async function GET(request: Request) {
  return runCronJob(request, "retry-failed-payments", run);
}

export async function POST(request: Request) {
  return runCronJob(request, "retry-failed-payments", run);
}
