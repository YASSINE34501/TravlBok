import "server-only";
import { prisma } from "@/lib/db";
import { Prisma, type FuelType, type TransmissionType } from "@/generated/prisma/client";
import { getUnavailableVehicleIds } from "./availability";

export type VehicleSearchParams = {
  location?: string;
  dropoffLocation?: string;
  pickupAt?: Date;
  returnAt?: Date;
  categoryCode?: string;
  brand?: string;
  transmission?: TransmissionType;
  fuel?: FuelType;
  minSeats?: number;
  minPrice?: number;
  maxPrice?: number;
  unlimitedMileage?: boolean;
  insuranceRequired?: boolean;
  deliveryRequired?: boolean;
  sort?: "recommended" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
};

export async function searchVehicles(params: VehicleSearchParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 12;

  const where: Prisma.VehicleWhereInput = {
    approvalStatus: "PUBLISHED",
    status: "AVAILABLE",
    deletedAt: null,
    ...(params.location
      ? {
          branch: {
            is: {
              OR: [
                { name: { contains: params.location, mode: "insensitive" } },
                {
                  city: {
                    is: { name: { path: ["en"], string_contains: params.location } },
                  },
                },
              ],
            },
          },
        }
      : {}),
    ...(params.dropoffLocation
      ? {
          OR: [
            { branch: { is: { name: { contains: params.dropoffLocation, mode: "insensitive" } } } },
            {
              branch: {
                is: {
                  city: {
                    is: { name: { path: ["en"], string_contains: params.dropoffLocation } },
                  },
                },
              },
            },
          ],
        }
      : {}),
    ...(params.categoryCode ? { category: { is: { code: params.categoryCode } } } : {}),
    ...(params.brand ? { brand: { contains: params.brand, mode: "insensitive" } } : {}),
    ...(params.transmission ? { transmission: params.transmission } : {}),
    ...(params.fuel ? { fuel: params.fuel } : {}),
    ...(params.minSeats ? { seats: { gte: params.minSeats } } : {}),
    ...(params.minPrice ? { pricePerDay: { gte: params.minPrice } } : {}),
    ...(params.maxPrice ? { pricePerDay: { lte: params.maxPrice } } : {}),
    ...(params.unlimitedMileage ? { mileagePolicy: "UNLIMITED" } : {}),
    ...(params.insuranceRequired ? { insuranceOptions: { not: Prisma.JsonNull } } : {}),
    ...(params.deliveryRequired ? { airportDeliveryAvailable: true } : {}),
  };

  if (params.pickupAt && params.returnAt) {
    const candidates = await prisma.vehicle.findMany({ where, select: { id: true } });
    const unavailable = await getUnavailableVehicleIds(
      params.pickupAt,
      params.returnAt,
      candidates.map((c) => c.id)
    );
    if (unavailable.size > 0) {
      where.id = { notIn: Array.from(unavailable) };
    }
  }

  const orderBy: Prisma.VehicleOrderByWithRelationInput =
    params.sort === "price_asc"
      ? { pricePerDay: "asc" }
      : params.sort === "price_desc"
        ? { pricePerDay: "desc" }
        : { publishedAt: "desc" };

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        branch: { include: { city: true, country: true } },
        category: true,
        media: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return { vehicles, total, page, pageSize };
}

export async function getVehicleById(vehicleId: string) {
  return prisma.vehicle.findFirst({
    where: { id: vehicleId, approvalStatus: "PUBLISHED", deletedAt: null },
    include: {
      branch: { include: { city: true, country: true, organization: true } },
      category: true,
      media: { orderBy: { sortOrder: "asc" } },
      reviews: {
        where: { status: "APPROVED" },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function getFeaturedVehicles(take = 6) {
  return prisma.vehicle.findMany({
    where: { approvalStatus: "PUBLISHED", status: "AVAILABLE", deletedAt: null },
    orderBy: { publishedAt: "desc" },
    take,
    include: {
      branch: { include: { city: true } },
      category: true,
      media: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
}
