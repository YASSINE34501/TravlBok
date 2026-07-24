"use server";

import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { generateTotpSecret, buildOtpAuthUrl, verifyTotpCode, generateBackupCodes } from "@/lib/auth/totp";
import { logAudit } from "@/lib/audit";

type PlainResult = { success: true } | { success: false; error: string };
type DataResult<T> = { success: true; data: T } | { success: false; error: string };

/**
 * Step 1 of enrollment: generates a fresh secret and stores it (with
 * `twoFactorEnabled` still false) so `enableTwoFactorAction` can verify
 * against it — the secret only takes effect once the user proves they can
 * generate a valid code from it.
 */
export async function generateTwoFactorSetupAction(
  locale: string
): Promise<DataResult<{ secret: string; qrDataUrl: string }>> {
  const user = await requireUser(locale);

  const secret = generateTotpSecret();
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } });

  const otpAuthUrl = buildOtpAuthUrl(secret, user.email);
  const qrDataUrl = await QRCode.toDataURL(otpAuthUrl);

  return { success: true, data: { secret, qrDataUrl } };
}

export async function enableTwoFactorAction(
  locale: string,
  code: string
): Promise<DataResult<{ backupCodes: string[] }>> {
  const user = await requireUser(locale);

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!dbUser.twoFactorSecret) {
    return { success: false, error: "setupNotStarted" };
  }
  if (!verifyTotpCode(dbUser.twoFactorSecret, code)) {
    return { success: false, error: "invalidCode" };
  }

  const backupCodes = generateBackupCodes();
  const hashedBackupCodes = await Promise.all(backupCodes.map((c) => hashPassword(c)));

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true, twoFactorBackupCodes: hashedBackupCodes },
  });

  await logAudit({
    actorUserId: user.id,
    action: "security.2fa.enable",
    entityType: "User",
    entityId: user.id,
  });

  return { success: true, data: { backupCodes } };
}

export async function disableTwoFactorAction(
  locale: string,
  password: string
): Promise<PlainResult> {
  const user = await requireUser(locale);

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!dbUser.passwordHash || !(await verifyPassword(password, dbUser.passwordHash))) {
    return { success: false, error: "invalidPassword" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: [] },
  });

  await logAudit({
    actorUserId: user.id,
    action: "security.2fa.disable",
    entityType: "User",
    entityId: user.id,
  });

  return { success: true };
}

export async function regenerateBackupCodesAction(
  locale: string
): Promise<DataResult<{ backupCodes: string[] }>> {
  const user = await requireUser(locale);

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!dbUser.twoFactorEnabled) {
    return { success: false, error: "twoFactorNotEnabled" };
  }

  const backupCodes = generateBackupCodes();
  const hashedBackupCodes = await Promise.all(backupCodes.map((c) => hashPassword(c)));

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorBackupCodes: hashedBackupCodes },
  });

  await logAudit({
    actorUserId: user.id,
    action: "security.2fa.regenerate_backup_codes",
    entityType: "User",
    entityId: user.id,
  });

  return { success: true, data: { backupCodes } };
}

/** "Session revocation" — invalidates every JWT issued before now (see src/lib/rbac.ts's getCurrentUser). The current browser session gets a fresh token on its next request via the normal sign-in flow, so this action itself does not sign the caller out immediately client-side; the UI should prompt them to log back in. */
export async function signOutAllDevicesAction(locale: string): Promise<PlainResult> {
  const user = await requireUser(locale);

  await prisma.user.update({
    where: { id: user.id },
    data: { sessionsInvalidatedAt: new Date() },
  });

  await logAudit({
    actorUserId: user.id,
    action: "security.sessions.revoke_all",
    entityType: "User",
    entityId: user.id,
  });

  return { success: true };
}

export async function getLoginHistoryAction(
  locale: string
): Promise<{ id: string; action: string; ipAddress: string | null; userAgent: string | null; createdAt: string }[]> {
  const user = await requireUser(locale);

  const logs = await prisma.auditLog.findMany({
    where: { actorUserId: user.id, action: { in: ["auth.login", "auth.login_failed", "auth.login_failed_2fa"] } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    ipAddress: l.ipAddress,
    userAgent: l.userAgent,
    createdAt: l.createdAt.toISOString(),
  }));
}
