import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Health check endpoint for load balancers/orchestrators (Docker Compose
 * healthcheck, a future Kubernetes readiness/liveness probe, uptime
 * monitoring). Checks real DB connectivity, not just "the process is
 * running" — a Next.js server can be up while its database connection pool
 * is exhausted or the database itself is unreachable.
 */
export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: "connected",
      responseTimeMs: Date.now() - startedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: "unreachable",
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 503 }
    );
  }
}
