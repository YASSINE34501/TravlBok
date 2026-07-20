import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma, FuelType, TransmissionType } from "@/generated/prisma/client";

export type VehicleSearchParams = {
  location?: string;
  categoryCode?: string;
  brand?: string;
  transmission?: TransmissionType;
  fuel?: FuelType;
  minSeats?: number;
  minPrice?: number;
  maxPrice?: number;
  unlimitedMileage?: boolean;
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
    ...(params.categoryCode ? { category: { is: { code: params.categoryCode } } } : {}),
    ...(params.brand ? { brand: { contains: params.brand, mode: "insensitive" } } : {}),
    ...(params.transmission ? { transmission: params.transmission } : {}),
    ...(params.fuel ? { fuel: params.fuel } : {}),
    ...(params.minSeats ? { seats: { gte: params.minSeats } } : {}),
    ...(params.minPrice ? { pricePerDay: { gte: params.minPrice } } : {}),
    ...(params.maxPrice ? { pricePerDay: { lte: params.maxPrice } } : {}),
    ...(params.unlimitedMileage ? { mileagePolicy: "UNLIMITED" } : {}),
  };

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
