import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

if (!process.env.DATABASE_URL) {
  // Fails immediately and clearly at startup instead of a cryptic low-level
  // pg connection error on the first query — this is the one env var the
  // app truly cannot run without in any capacity.
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and configure a Postgres connection string."
  );
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
