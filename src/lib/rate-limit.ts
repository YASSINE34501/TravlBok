import "server-only";
import { prisma } from "@/lib/db";

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMs: number };

/**
 * A generic fixed-window rate limiter backed by Postgres. Deliberately not
 * Redis — this app has no Redis instance yet ("Redis-ready architecture" is
 * Phase 3 Performance/Scale prep, not a requirement to actually stand one up
 * here); swapping the backing store later means replacing this one
 * function's body, not every call site.
 *
 * `key` should already encode what's being limited (e.g. `login:email:x@y.com`
 * or `login:ip:1.2.3.4`) — this function does not know or care what it means.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();

  const bucket = await prisma.rateLimitBucket.findUnique({ where: { key } });

  if (!bucket || now.getTime() - bucket.windowStart.getTime() >= windowMs) {
    await prisma.rateLimitBucket.upsert({
      where: { key },
      update: { count: 1, windowStart: now },
      create: { key, count: 1, windowStart: now },
    });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    const retryAfterMs = windowMs - (now.getTime() - bucket.windowStart.getTime());
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  await prisma.rateLimitBucket.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return { allowed: true };
}
