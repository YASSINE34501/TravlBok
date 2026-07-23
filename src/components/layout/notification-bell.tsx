"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import {
  getMyNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  type NotificationItem,
} from "@/domains/notifications/actions";

const POLL_INTERVAL_MS = 60_000;

export function NotificationBell({ locale }: { locale: string }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const applyResult = useCallback((result: { notifications: NotificationItem[]; unreadCount: number }) => {
    setNotifications(result.notifications);
    setUnreadCount(result.unreadCount);
  }, []);

  const refresh = useCallback(async () => {
    const result = await getMyNotificationsAction(locale, 8);
    applyResult(result);
  }, [locale, applyResult]);

  useEffect(() => {
    let cancelled = false;
    function load() {
      getMyNotificationsAction(locale, 8).then((result) => {
        if (!cancelled) applyResult(result);
      });
    }
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [locale, applyResult]);

  async function handleOpenNotification(notification: NotificationItem) {
    if (!notification.readAt) {
      await markNotificationReadAction(locale, notification.id);
      await refresh();
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsReadAction(locale);
    await refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications" />
        }
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground">No notifications yet.</p>
          )}
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleOpenNotification(n)}
              className={`block w-full border-t px-3 py-2 text-start text-sm hover:bg-muted ${
                n.readAt ? "text-muted-foreground" : "font-medium"
              }`}
            >
              <p>{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.message}</p>
            </button>
          ))}
        </div>
        <div className="border-t px-3 py-2 text-center">
          <Link href="/account/notifications" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
