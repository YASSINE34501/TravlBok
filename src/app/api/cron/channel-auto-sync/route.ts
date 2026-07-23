import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runPushSync, runPullSync } from "@/domains/channel-manager/sync";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Meant to be invoked periodically by an external scheduler (same pattern
 * as /api/cron/retry-failed-payments) — no in-app job queue, per Phase 3's
 * "Performance and Scalability" scope boundary (Redis-ready architecture is
 * prep, not a requirement to actually stand up a queue in this phase).
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({ processed: results.length, results });
}
