import { getTranslations } from "next-intl/server";
import {
  getAllChannelConnectionsForAdmin,
  getRecentSyncJobsForAdmin,
} from "@/domains/channel-manager/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ForceDisconnectChannelButton } from "@/components/admin/force-disconnect-channel-button";

export default async function AdminChannelsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");
  const tConnStatus = await getTranslations("ChannelConnectionStatus");
  const tJobType = await getTranslations("SyncJobType");
  const tJobDirection = await getTranslations("SyncJobDirection");
  const tJobStatus = await getTranslations("SyncJobStatus");

  const [connections, recentJobs] = await Promise.all([
    getAllChannelConnectionsForAdmin(),
    getRecentSyncJobsForAdmin(30),
  ]);

  const conflictCount = recentJobs.filter((j) => j.status === "CONFLICT").length;
  const failedCount = recentJobs.filter((j) => j.status === "FAILED").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("channelManager")}</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Active connections</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {connections.filter((c) => c.status === "CONNECTED").length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Recent conflicts</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{conflictCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Recent failures</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{failedCount}</CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">Connections</h2>
        <div className="mt-2 space-y-2">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <span>
                {connection.organization.displayName} · {connection.hotel.name} ·{" "}
                {connection.provider}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant={connection.status === "CONNECTED" ? "default" : "secondary"}>
                  {tConnStatus(connection.status)}
                </Badge>
                <span className="text-muted-foreground">
                  {connection._count.syncJobs} jobs · {connection._count.reservationImports} imports
                </span>
                {connection.status === "CONNECTED" && (
                  <ForceDisconnectChannelButton locale={locale} connectionId={connection.id} />
                )}
              </div>
            </div>
          ))}
          {connections.length === 0 && (
            <p className="text-sm text-muted-foreground">No channel connections yet.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">Recent sync jobs</h2>
        <div className="mt-2 space-y-2">
          {recentJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>
                {job.channelConnection.organization.displayName} · {job.channelConnection.hotel.name} ·{" "}
                {tJobType(job.type)} · {tJobDirection(job.direction)}
              </span>
              <Badge
                variant={
                  job.status === "COMPLETED"
                    ? "default"
                    : job.status === "FAILED" || job.status === "CONFLICT"
                      ? "destructive"
                      : "secondary"
                }
              >
                {tJobStatus(job.status)}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
