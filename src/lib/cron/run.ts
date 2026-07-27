import "server-only";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";

// A "RUNNING" row older than this is treated as an orphaned/crashed run
// (the function died without reaching the finally-release) rather than a
// genuinely still-in-progress one, so the job isn't permanently stuck.
const STALE_AFTER_MS = 10 * 60 * 1000;

/**
 * Atomically claims the right to run `jobName` via a single INSERT ...
 * ON CONFLICT DO UPDATE ... WHERE statement — one round trip, correct under
 * pgbouncer transaction pooling (no session-scoped advisory lock, no
 * transaction held open around slow external API calls). Returns false if
 * another invocation already holds the claim and it isn't stale yet.
 */
async function claimCronRun(jobName: string): Promise<boolean> {
  const staleThreshold = new Date(Date.now() - STALE_AFTER_MS);
  const id = randomUUID();
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO "CronRun" ("id", "jobName", "status", "startedAt")
    VALUES (${id}, ${jobName}, 'RUNNING'::"CronRunStatus", now())
    ON CONFLICT ("jobName") DO UPDATE
      SET "status" = 'RUNNING'::"CronRunStatus", "startedAt" = now(), "finishedAt" = NULL
      WHERE "CronRun"."status" != 'RUNNING'::"CronRunStatus" OR "CronRun"."startedAt" < ${staleThreshold}
    RETURNING "CronRun"."id"
  `;
  return rows.length > 0;
}

async function releaseCronRun(jobName: string, status: "COMPLETED" | "FAILED"): Promise<void> {
  await prisma.cronRun.update({
    where: { jobName },
    data: { status, finishedAt: new Date() },
  });
}

/**
 * Shared entry point for every /api/cron/* route: verifies the shared
 * secret (Vercel Cron's GET+Bearer convention or the legacy POST header),
 * claims the per-job lock so overlapping invocations can't double-process
 * the same rows, runs the job, and always returns a safe JSON response —
 * never an unhandled exception.
 */
export async function runCronJob<T extends Record<string, unknown>>(
  request: Request,
  jobName: string,
  job: () => Promise<T>
): Promise<NextResponse> {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const claimed = await claimCronRun(jobName);
  if (!claimed) {
    return NextResponse.json({ skipped: true, reason: "already running" }, { status: 200 });
  }

  try {
    const result = await job();
    await releaseCronRun(jobName, "COMPLETED");
    return NextResponse.json({ skipped: false, ...result }, { status: 200 });
  } catch (error) {
    console.error(`[cron:${jobName}] job failed`, error);
    await releaseCronRun(jobName, "FAILED");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
