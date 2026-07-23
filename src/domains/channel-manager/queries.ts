import "server-only";
import { prisma } from "@/lib/db";

export async function getChannelConnectionsForOrganization(organizationId: string) {
  return prisma.channelConnection.findMany({
    where: { organizationId },
    include: {
      hotel: { select: { id: true, name: true } },
      roomMappings: { where: { isActive: true }, include: { roomType: { select: { name: true } } } },
      _count: { select: { syncJobs: true, reservationImports: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getChannelConnectionDetail(connectionId: string, organizationId: string) {
  return prisma.channelConnection.findFirst({
    where: { id: connectionId, organizationId },
    include: {
      hotel: { include: { roomTypes: { where: { isActive: true } } } },
      roomMappings: { where: { isActive: true }, include: { roomType: { select: { name: true } } } },
      syncJobs: { orderBy: { startedAt: "desc" }, take: 20 },
      reservationImports: {
        where: { hasConflict: true },
        include: { reservation: true },
        orderBy: { importedAt: "desc" },
      },
    },
  });
}

export async function getSyncJobDetail(syncJobId: string) {
  return prisma.syncJob.findUnique({
    where: { id: syncJobId },
    include: { logEntries: { orderBy: { createdAt: "asc" } }, channelConnection: true },
  });
}

export async function getAllChannelConnectionsForAdmin() {
  return prisma.channelConnection.findMany({
    include: {
      organization: { select: { displayName: true } },
      hotel: { select: { name: true } },
      _count: { select: { syncJobs: true, reservationImports: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRecentSyncJobsForAdmin(take = 50) {
  return prisma.syncJob.findMany({
    include: {
      channelConnection: {
        include: { organization: { select: { displayName: true } }, hotel: { select: { name: true } } },
      },
    },
    orderBy: { startedAt: "desc" },
    take,
  });
}
