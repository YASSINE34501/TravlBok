import { notFound } from "next/navigation";
import { getPartnerContext } from "@/lib/partner-context";
import { getChannelConnectionDetail } from "@/domains/channel-manager/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ChannelSyncJobsPage({
  params,
}: {
  params: Promise<{ locale: string; connectionId: string }>;
}) {
  const { locale, connectionId } = await params;
  const { organization } = await getPartnerContext(locale);

  const connection = await getChannelConnectionDetail(connectionId, organization.id);
  if (!connection) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        Sync history — {connection.hotel.name} ({connection.provider})
      </h1>

      <div className="space-y-3">
        {connection.syncJobs.map((job) => (
          <Card key={job.id}>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium">
                {job.type} · {job.direction} · {job.startedAt.toLocaleString()}
              </CardTitle>
              <Badge
                variant={
                  job.status === "COMPLETED"
                    ? "default"
                    : job.status === "FAILED" || job.status === "CONFLICT"
                      ? "destructive"
                      : "secondary"
                }
              >
                {job.status}
              </Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {job.itemsProcessed} processed, {job.itemsFailed} failed
              {job.errorMessage ? ` — ${job.errorMessage}` : ""}
            </CardContent>
          </Card>
        ))}
        {connection.syncJobs.length === 0 && (
          <p className="text-sm text-muted-foreground">No sync jobs yet.</p>
        )}
      </div>
    </div>
  );
}
