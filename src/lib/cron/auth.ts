import "server-only";
import { timingSafeEqual } from "node:crypto";
import { getCronSecret } from "@/lib/env";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual requires equal-length buffers — the length check itself
  // is a (universally-accepted) minor timing leak of the secret's length,
  // not its contents; there is no way to compare arbitrary-length strings
  // in constant time without it.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Accepts Vercel Cron's native convention (`Authorization: Bearer <secret>`,
 * sent on the GET request Vercel actually issues) and the legacy
 * `x-cron-secret` header (kept for any external scheduler already using the
 * old POST-based integration). Returns false — never throws — if CRON_SECRET
 * itself isn't configured, so an unconfigured deployment fails closed.
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  let expected: string;
  try {
    expected = getCronSecret();
  } catch {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const [scheme, token] = authHeader.split(" ");
    if (scheme === "Bearer" && token && safeEqual(token, expected)) return true;
  }

  const legacyHeader = request.headers.get("x-cron-secret");
  if (legacyHeader && safeEqual(legacyHeader, expected)) return true;

  return false;
}
