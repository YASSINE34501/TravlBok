import "server-only";
import { prisma } from "@/lib/db";

export type BranchPerformance = {
  id: string;
  name: string;
  isMainBranch: boolean;
  vehicleCount: number;
  rentedCount: number;
  utilizationPercent: number;
  revenue: number;
};

/**
 * "Branch revenue/utilization" — utilization is a simple currently-rented /
 * total-vehicles snapshot (not a time-windowed rate), and revenue sums raw
 * `Reservation.totalAmount` for CONFIRMED/COMPLETED bookings without
 * cross-currency conversion, consistent with how the existing
 * dashboard/payments list already displays amounts (single organization
 * base currency assumed for this internal comparison view).
 */
export async function getBranchPerformance(organizationId: string): Promise<BranchPerformance[]> {
  const branches = await prisma.carBranch.findMany({
    where: { organizationId, deletedAt: null },
    include: { vehicles: { where: { deletedAt: null } } },
    orderBy: { createdAt: "desc" },
  });

  const vehicleIds = branches.flatMap((b) => b.vehicles.map((v) => v.id));
  const links = vehicleIds.length
    ? await prisma.carReservationLink.findMany({
        where: {
          vehicleId: { in: vehicleIds },
          reservation: { status: { in: ["CONFIRMED", "COMPLETED"] } },
        },
        include: { reservation: { select: { totalAmount: true } } },
      })
    : [];

  const revenueByVehicle = new Map<string, number>();
  for (const link of links) {
    revenueByVehicle.set(
      link.vehicleId,
      (revenueByVehicle.get(link.vehicleId) ?? 0) + Number(link.reservation.totalAmount)
    );
  }

  return branches.map((branch) => {
    const vehicleCount = branch.vehicles.length;
    const rentedCount = branch.vehicles.filter((v) => v.status === "RENTED").length;
    const revenue = branch.vehicles.reduce((sum, v) => sum + (revenueByVehicle.get(v.id) ?? 0), 0);
    return {
      id: branch.id,
      name: branch.name,
      isMainBranch: branch.isMainBranch,
      vehicleCount,
      rentedCount,
      utilizationPercent: vehicleCount > 0 ? Math.round((rentedCount / vehicleCount) * 100) : 0,
      revenue,
    };
  });
}
