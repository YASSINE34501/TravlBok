import "server-only";
import { prisma } from "@/lib/db";

export async function getApiKeysForOrganization(organizationId: string) {
  return prisma.apiKey.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}
