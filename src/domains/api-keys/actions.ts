"use server";

import { randomBytes, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrganizationAccess, ROLE_GROUPS } from "@/lib/rbac";
import { hasFeature } from "@/domains/subscriptions/limits";
import { logAudit } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

function hashKey(rawKey: string): string {
  // API keys are long, high-entropy random tokens (not user-memorable
  // secrets) — a fast cryptographic hash is the standard practice here,
  // unlike passwords/backup-codes which use bcrypt to slow down guessing.
  return createHash("sha256").update(rawKey).digest("hex");
}

async function requireApiKeyAccess(locale: string, organizationId: string) {
  const user = await requireOrganizationAccess(locale, organizationId, ROLE_GROUPS.partnerOwners);
  const enabled = await hasFeature(organizationId, "featureApiAccess");
  if (!enabled) {
    throw new Error("API access is not enabled on this organization's plan");
  }
  return user;
}

export async function createApiKeyAction(
  locale: string,
  organizationId: string,
  name: string
): Promise<{ success: true; rawKey: string } | { success: false; error: string }> {
  const user = await requireApiKeyAccess(locale, organizationId);
  if (!name.trim()) return { success: false, error: "invalidInput" };

  const rawKey = `tb_${randomBytes(24).toString("hex")}`;
  const hashedKey = hashKey(rawKey);

  await prisma.apiKey.create({
    data: {
      organizationId,
      name: name.trim(),
      keyPrefix: rawKey.slice(0, 10),
      hashedKey,
      createdByUserId: user.id,
    },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "api_key.create",
    entityType: "ApiKey",
    metadata: { name: name.trim() },
  });

  revalidatePath(`/${locale}/dashboard/api-keys`);
  return { success: true, rawKey };
}

export async function revokeApiKeyAction(
  locale: string,
  organizationId: string,
  apiKeyId: string
): Promise<ActionResult> {
  const user = await requireApiKeyAccess(locale, organizationId);

  const key = await prisma.apiKey.findFirst({ where: { id: apiKeyId, organizationId } });
  if (!key) return { success: false, error: "notFound" };

  await prisma.apiKey.update({ where: { id: apiKeyId }, data: { revokedAt: new Date() } });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "api_key.revoke",
    entityType: "ApiKey",
    entityId: apiKeyId,
  });

  revalidatePath(`/${locale}/dashboard/api-keys`);
  return { success: true };
}

/**
 * Verifies a raw API key presented by a caller (e.g. `Authorization: Bearer tb_...`)
 * and updates `lastUsedAt`. No public REST endpoint calls this yet — same
 * honest-scaffold reasoning as Channel Manager's webhook route: real
 * infrastructure, ready for a future API surface, not a fake integration.
 */
export async function verifyApiKey(rawKey: string) {
  const hashedKey = hashKey(rawKey);
  const key = await prisma.apiKey.findUnique({ where: { hashedKey } });
  if (!key || key.revokedAt) return null;

  await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
  return key;
}
