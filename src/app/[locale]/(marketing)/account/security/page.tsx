import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { getLoginHistoryAction } from "@/domains/security/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TwoFactorSettings } from "@/components/auth/two-factor-settings";
import { SignOutAllDevicesButton } from "@/components/auth/sign-out-all-devices-button";

export default async function AccountSecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireUser(locale);

  const [dbUser, loginHistory] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { twoFactorEnabled: true } }),
    getLoginHistoryAction(locale),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Security</h1>

      <TwoFactorSettings locale={locale} initiallyEnabled={dbUser.twoFactorEnabled} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If you suspect unauthorized access, sign out of every device. You&apos;ll need to log
            back in here afterward.
          </p>
          <SignOutAllDevicesButton locale={locale} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent login activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loginHistory.length === 0 && (
            <p className="text-sm text-muted-foreground">No login activity recorded yet.</p>
          )}
          {loginHistory.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <span>
                {entry.ipAddress ?? "unknown IP"}
                {entry.userAgent ? ` · ${entry.userAgent.slice(0, 60)}` : ""}
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{new Date(entry.createdAt).toLocaleString(locale)}</span>
                {entry.action !== "auth.login" && <Badge variant="destructive">Failed</Badge>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
