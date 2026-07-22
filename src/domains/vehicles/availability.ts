import "server-only";
import { prisma } from "@/lib/db";

/**
 * Read-only counterpart of the overlap check performed inside
 * createCarReservationAction's transaction. Used by search to exclude
 * vehicles that are already booked for the requested pickup/return window.
 */
export async function getUnavailableVehicleIds(
  pickupAt: Date,
  returnAt: Date,
  candidateVehicleIds: string[]
): Promise<Set<string>> {
  if (candidateVehicleIds.length === 0) return new Set();

  const overlapping = await prisma.reservation.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      pickupAt: { lt: returnAt },
      returnAt: { gt: pickupAt },
      carLink: { vehicleId: { in: candidateVehicleIds } },
    },
    select: { carLink: { select: { vehicleId: true } } },
  });

  return new Set(
    overlapping
      .map((reservation) => reservation.carLink?.vehicleId)
      .filter((id): id is string => !!id)
  );
}
