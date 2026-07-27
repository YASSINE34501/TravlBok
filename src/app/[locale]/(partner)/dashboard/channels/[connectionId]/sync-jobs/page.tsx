import { notFound } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { getChannelConnectionDetail } from "@/domains/channel-manager/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SYNC_JOB_STATUS_TONE } from "@/lib/status-tones";

export default async function ChannelSyncJobsPage({
  params,
}: {
  params: Promise<{ locale: string; connectionId: string }>;
}) {
  const { locale, connectionId } = await params;
  const { organization } = await getPartnerContext(locale);
  const tJobType = await getTranslations("SyncJobType");
  const tJobDirection = await getTranslations("SyncJobDirection");
  const tJobStatus = await getTranslations("SyncJobStatus");

  const connection = await getChannelConnectionDetail(connectionId, organization.id);
  if (!connection) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Sync history — ${connection.hotel.name} (${connection.provider})`} />

      {connection.syncJobs.length === 0 ? (
        <EmptyState icon={RefreshCw} title="No sync jobs yet" />
      ) : (
        <div className="space-y-3">
          {connection.syncJobs.map((job) => (
            <Card key={job.id} className="rounded-2xl">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium">
                  {tJobType(job.type)} · {tJobDirection(job.direction)} · {job.startedAt.toLocaleString()}
                </CardTitle>
                <StatusBadge tone={SYNC_JOB_STATUS_TONE[job.status]}>{tJobStatus(job.status)}</StatusBadge>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {job.itemsProcessed} processed, {job.itemsFailed} failed
                {job.errorMessage ? ` — ${job.errorMessage}` : ""}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
