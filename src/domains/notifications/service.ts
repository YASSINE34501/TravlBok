import "server-only";
import { getTranslations } from "next-intl/server";
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
 *
 * `title`/`message` are the English fallback (stored as-is, used if the
 * recipient's locale can't be resolved or no key was provided — keeps every
 * existing call site working unmodified). `titleKey`/`messageKey` + `params`
 * are optional `Notifications` namespace keys — when present, the recipient
 * sees/receives the notification in *their own* `user.locale`, not the
 * locale of whoever/whatever triggered the event.
 */
export async function notifyUser(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  titleKey?: string;
  messageKey?: string;
  params?: Record<string, string | number>;
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
      titleKey: params.titleKey,
      messageKey: params.messageKey,
      paramsJson: params.params as Prisma.InputJsonValue | undefined,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
      channels,
    },
  });

  if (channels.includes("EMAIL")) {
    const user = await prisma.user.findUnique({ where: { id: params.userId } });
    if (user?.email) {
      try {
        let title = params.title;
        let message = params.message;
        if (params.titleKey || params.messageKey) {
          const t = await getTranslations({ locale: user.locale, namespace: "Notifications" });
          // Cast to a permissive signature — the key is a runtime string from
          // the call site, not a literal next-intl can narrow at compile time.
          const translate = t as unknown as (
            key: string,
            values?: Record<string, string | number>
          ) => string;
          if (params.titleKey) title = translate(params.titleKey, params.params);
          if (params.messageKey) message = translate(params.messageKey, params.params);
        }
        await sendNotificationEmail({
          to: user.email,
          firstName: user.firstName,
          title,
          message,
          locale: user.locale,
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
