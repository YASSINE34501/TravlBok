import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkNotificationReadButton } from "@/components/mark-notification-read-button";
import { EmptyState } from "@/components/empty-state";

export default async function AccountNotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireUser(locale);

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="mt-8">
          <EmptyState />
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {notifications.map((n) => (
            <Card key={n.id}>
              <CardContent className="flex items-start justify-between gap-3 py-4">
                <div>
                  <p className={n.readAt ? "font-medium" : "font-semibold"}>{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.createdAt.toLocaleString(locale)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!n.readAt && <Badge variant="secondary">New</Badge>}
                  {!n.readAt && (
                    <MarkNotificationReadButton locale={locale} notificationId={n.id} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
