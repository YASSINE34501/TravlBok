import { z } from "zod";

export const hotelSchema = z.object({
  name: z.string().trim().min(1).max(200),
  descriptionEn: z.string().trim().max(4000).optional().or(z.literal("")),
  descriptionFr: z.string().trim().max(4000).optional().or(z.literal("")),
  descriptionAr: z.string().trim().max(4000).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  starRating: z.number().int().min(1).max(5).optional(),
  countryId: z.string().optional().or(z.literal("")),
  cityId: z.string().optional().or(z.literal("")),
  address: z.string().trim().min(1).max(300),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.email().optional().or(z.literal("")),
  website: z.url().optional().or(z.literal("")),
  checkInTime: z.string().trim().min(1).max(10),
  checkOutTime: z.string().trim().min(1).max(10),
  parking: z.boolean(),
  breakfast: z.boolean(),
  restaurant: z.boolean(),
  swimmingPool: z.boolean(),
  spa: z.boolean(),
  gym: z.boolean(),
  wifi: z.boolean(),
  airportShuttle: z.boolean(),
  amenityIds: z.array(z.string()),
});

export type HotelInput = z.infer<typeof hotelSchema>;
