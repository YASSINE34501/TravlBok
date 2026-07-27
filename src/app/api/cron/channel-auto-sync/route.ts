import { prisma } from "@/lib/db";
import { runPushSync, runPullSync } from "@/domains/channel-manager/sync";
import { logAudit } from "@/lib/audit";
import { runCronJob } from "@/lib/cron/run";

export const runtime = "nodejs";

/**
 * Invoked periodically by Vercel Cron (see vercel.json). Push/pull sync is
 * naturally idempotent (it reconciles state, it doesn't append), so the
 * main risk from an overlapping run is wasted duplicate work, not incorrect
 * data — the `runCronJob` lock avoids that too.
 */
async function run() {
  const connections = await prisma.channelConnection.findMany({
    where: { status: "CONNECTED", autoSyncEnabled: true },
    select: { id: true },
  });

  const results: { channelConnectionId: string; outcome: string }[] = [];

  for (const connection of connections) {
    try {
      await runPushSync(connection.id, "FULL");
      await runPullSync(connection.id);
      results.push({ channelConnectionId: connection.id, outcome: "synced" });
    } catch (error) {
      results.push({
        channelConnectionId: connection.id,
        outcome: error instanceof Error ? error.message : "error",
      });
    }
  }

  await logAudit({
    action: "channel_manager.auto_sync_job.run",
    entityType: "ChannelConnection",
    metadata: { count: results.length },
  });

  return { processed: results.length, results };
}

export async function GET(request: Request) {
  return runCronJob(request, "channel-auto-sync", run);
}

export async function POST(request: Request) {
  return runCronJob(request, "channel-auto-sync", run);
}
