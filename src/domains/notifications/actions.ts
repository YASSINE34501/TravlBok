"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

export async function getMyNotificationsAction(
  locale: string,
  limit = 10
): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
  const user = await requireUser(locale);

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  return {
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  };
}

export async function markNotificationReadAction(locale: string, notificationId: string): Promise<void> {
  const user = await requireUser(locale);
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsReadAction(locale: string): Promise<void> {
  const user = await requireUser(locale);
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}
