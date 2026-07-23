import "server-only";
import { prisma } from "@/lib/db";
import { toDateKey } from "@/domains/reservations/pricing";

/**
 * Persists the LIVE pricing-calendar/history entry for each night of a real
 * booking that a dynamic pricing rule actually adjusted. Best-effort: a
 * logging failure must never fail the booking itself, so callers should
 * await this after their transaction has already committed and swallow
 * errors (this function does so internally).
 */
export async function logDynamicPricesForBooking(
  roomTypeId: string,
  nights: Date[],
  detail: Map<string, { basePrice: number; finalPrice: number; appliedRuleIds: string[] }>
): Promise<void> {
  if (detail.size === 0) return;

  try {
    await Promise.all(
      nights.map((night) => {
        const entry = detail.get(toDateKey(night));
        if (!entry) return Promise.resolve();
        return prisma.dynamicPriceLog.upsert({
          where: { roomTypeId_date: { roomTypeId, date: night } },
          update: {
            basePrice: entry.basePrice,
            finalPrice: entry.finalPrice,
            appliedRuleIds: entry.appliedRuleIds,
            source: "LIVE",
          },
          create: {
            roomTypeId,
            date: night,
            basePrice: entry.basePrice,
            finalPrice: entry.finalPrice,
            appliedRuleIds: entry.appliedRuleIds,
            source: "LIVE",
          },
        });
      })
    );
  } catch {
    // Non-critical: the booking already succeeded. The next recalculation
    // pass or live booking on the same date will simply overwrite this row.
  }
}
