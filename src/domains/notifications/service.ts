import "server-only";
import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email";
import { ROLE_GROUPS } from "@/lib/rbac";
import type { Prisma } from "@/generated/prisma/client";

export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS_READY" | "WHATSAPP_READY" | "PUSH_READY";

/**
 * The single write path for every in-app Notification in the app (bookings
 * already used a bare `prisma.notification.create`; every other MASTER-PLAN
 * event category now goes through this so channel handling — email send,
 * "-ready" scaffold logging — lives in one place, not duplicated per event).
 */
export async function notifyUser(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  channels?: NotificationChannel[];
}): Promise<void> {
  const channels = params.channels ?? ["IN_APP"];

  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
      channels,
    },
  });

  if (channels.includes("EMAIL")) {
    const user = await prisma.user.findUnique({ where: { id: params.userId } });
    if (user?.email) {
      try {
        await sendNotificationEmail({
          to: user.email,
          firstName: user.firstName,
          title: params.title,
          message: params.message,
        });
      } catch (error) {
        // Email is a best-effort secondary channel — the in-app row above
        // already succeeded, so a provider hiccup must never surface as a
        // failure of the triggering action (booking, cancellation, etc.).
        console.error("[notifications] email send failed", error);
      }
    }
  }

  for (const channel of channels) {
    if (channel === "SMS_READY" || channel === "WHATSAPP_READY" || channel === "PUSH_READY") {
      console.info(
        `[notifications] ${channel}: no provider connected — recorded intent only for "${params.title}" (user ${params.userId})`
      );
    }
  }
}

/** Notifies every active owner/manager-tier member of an organization — used for org-level events (approvals, sync errors, low inventory, subscription changes) that aren't addressed to one specific user. */
export async function notifyOrganizationOwners(
  organizationId: string,
  params: Omit<Parameters<typeof notifyUser>[0], "userId">
): Promise<void> {
  const owners = await prisma.organizationMember.findMany({
    where: { organizationId, role: { in: ROLE_GROUPS.partnerOwners }, status: "ACTIVE" },
    select: { userId: true },
  });
  await Promise.all(owners.map((o) => notifyUser({ ...params, userId: o.userId })));
}
