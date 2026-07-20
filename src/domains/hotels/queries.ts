import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export type HotelSearchParams = {
  destination?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  stars?: number[];
  amenities?: string[];
  propertyTypeCode?: string;
  breakfastIncluded?: boolean;
  freeCancellation?: boolean;
  sort?: "recommended" | "price_asc" | "price_desc" | "rating";
  page?: number;
  pageSize?: number;
};

export async function searchHotels(params: HotelSearchParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 12;

  const roomTypeFilters: Prisma.RoomTypeWhereInput = {
    isActive: true,
    ...(params.guests ? { maxGuests: { gte: params.guests } } : {}),
    ...(params.minPrice ? { basePrice: { gte: params.minPrice } } : {}),
    ...(params.maxPrice ? { basePrice: { lte: params.maxPrice } } : {}),
    ...(params.breakfastIncluded ? { breakfastIncluded: true } : {}),
    ...(params.freeCancellation ? { refundable: true } : {}),
  };

  const where: Prisma.HotelWhereInput = {
    status: "PUBLISHED",
    deletedAt: null,
    ...(params.destination
      ? {
          OR: [
            { name: { contains: params.destination, mode: "insensitive" } },
            {
              city: {
                is: { name: { path: ["en"], string_contains: params.destination } },
              },
            },
          ],
        }
      : {}),
    ...(params.stars && params.stars.length > 0
      ? { starRating: { in: params.stars } }
      : {}),
    ...(params.propertyTypeCode
      ? { category: { is: { code: params.propertyTypeCode } } }
      : {}),
    ...(params.amenities && params.amenities.length > 0
      ? { amenities: { some: { code: { in: params.amenities } } } }
      : {}),
    roomTypes: { some: roomTypeFilters },
  };

  const orderBy: Prisma.HotelOrderByWithRelationInput =
    params.sort === "price_asc" || params.sort === "price_desc"
      ? {}
      : { publishedAt: "desc" };

  const [hotels, total] = await Promise.all([
    prisma.hotel.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        city: true,
        country: true,
        roomTypes: {
          where: roomTypeFilters,
          orderBy: { basePrice: "asc" },
          take: 1,
        },
        reviews: { where: { status: "APPROVED" }, select: { rating: true } },
      },
    }),
    prisma.hotel.count({ where }),
  ]);

  const results = hotels
    .map((hotel) => {
      const avgRating =
        hotel.reviews.length > 0
          ? hotel.reviews.reduce((sum, r) => sum + r.rating, 0) / hotel.reviews.length
          : null;
      return {
        ...hotel,
        avgRating,
        fromPrice: hotel.roomTypes[0]?.basePrice ?? null,
        fromPriceCurrency: hotel.roomTypes[0]?.currency ?? "MAD",
      };
    })
    .filter((hotel) => hotel.roomTypes.length > 0);

  if (params.sort === "price_asc") {
    results.sort((a, b) => Number(a.fromPrice ?? 0) - Number(b.fromPrice ?? 0));
  } else if (params.sort === "price_desc") {
    results.sort((a, b) => Number(b.fromPrice ?? 0) - Number(a.fromPrice ?? 0));
  } else if (params.sort === "rating") {
    results.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  }

  return { hotels: results, total, page, pageSize };
}

export async function getHotelById(hotelId: string) {
  return prisma.hotel.findFirst({
    where: { id: hotelId, status: "PUBLISHED", deletedAt: null },
    include: {
      city: true,
      country: true,
      category: true,
      amenities: true,
      media: { orderBy: { sortOrder: "asc" } },
      roomTypes: {
        where: { isActive: true, deletedAt: null },
        include: { amenities: true, media: { orderBy: { sortOrder: "asc" } } },
        orderBy: { basePrice: "asc" },
      },
      reviews: {
        where: { status: "APPROVED" },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function getFeaturedHotels(take = 6) {
  const hotels = await prisma.hotel.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: { publishedAt: "desc" },
    take,
    include: {
      city: true,
      roomTypes: { where: { isActive: true }, orderBy: { basePrice: "asc" }, take: 1 },
    },
  });

  return hotels
    .filter((h) => h.roomTypes.length > 0)
    .map((h) => ({
      ...h,
      fromPrice: h.roomTypes[0].basePrice,
      fromPriceCurrency: h.roomTypes[0].currency,
    }));
}

export async function getPopularDestinations(take = 6) {
  const grouped = await prisma.hotel.groupBy({
    by: ["cityId"],
    where: { status: "PUBLISHED", deletedAt: null, cityId: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { cityId: "desc" } },
    take,
  });

  const cityIds = grouped.map((g) => g.cityId).filter((id): id is string => !!id);
  const cities = await prisma.city.findMany({
    where: { id: { in: cityIds } },
    include: { country: true },
  });

  return grouped
    .map((g) => {
      const city = cities.find((c) => c.id === g.cityId);
      return city ? { city, hotelCount: g._count._all } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}
