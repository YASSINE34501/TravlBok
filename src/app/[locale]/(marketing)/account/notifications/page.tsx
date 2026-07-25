import { getTranslations } from "next-intl/server";
import { BellOff } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkNotificationReadButton } from "@/components/mark-notification-read-button";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AccountNotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireUser(locale);
  const t = await getTranslations("Account");
  const tCommon = await getTranslations("Common");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("notifications")}</h1>

      {notifications.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={BellOff} title={tCommon("noResults")} />
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className="rounded-2xl">
              <CardContent className="flex items-start justify-between gap-3 py-4">
                <div>
                  <p className={n.readAt ? "font-medium text-foreground" : "font-semibold text-foreground"}>
                    {n.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.createdAt.toLocaleString(locale)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!n.readAt && <Badge variant="secondary">{t("newLabel")}</Badge>}
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
