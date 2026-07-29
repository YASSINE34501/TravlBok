import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Reused across requests within the same warm serverless instance or dev-
// server process. Only stashed onto globalThis outside production, matching
// the original intent: survive Next.js dev-server hot-reload without
// exhausting DB connections, without leaking a stale client across cold
// starts in production.
let instance: PrismaClient | undefined = globalForPrisma.prisma;

function getPrismaClient(): PrismaClient {
  if (instance) return instance;

  if (!process.env.DATABASE_URL) {
    // Deliberately NOT a module-level check: Next.js evaluates every route
    // module during `next build`'s "Collecting page data" step regardless
    // of whether that route is later static or dynamic, so a top-level
    // throw here crashes the build itself on any platform where
    // DATABASE_URL isn't injected at build time (Railway/Render/Docker
    // commonly inject secrets at runtime only, not build time). Deferring
    // the check to first actual use means the build only ever needs
    // DATABASE_URL if a route tries to statically prerender a real query
    // result — the normal, desired failure mode.
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and configure a Postgres connection string."
    );
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  instance = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = instance;
  }

  return instance;
}

// A Proxy so every existing `import { prisma } from "@/lib/db"` call site
// (prisma.model.method(), prisma.$transaction(), prisma.$queryRaw, ...)
// keeps working unmodified, while the real PrismaClient (and its
// DATABASE_URL requirement) is only constructed on first actual property
// access — never merely on import.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrismaClient(), prop, receiver);
  },
});
