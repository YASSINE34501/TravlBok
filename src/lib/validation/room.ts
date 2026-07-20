import { z } from "zod";

export const BED_TYPE_OPTIONS = [
  "SINGLE",
  "TWIN",
  "DOUBLE",
  "QUEEN",
  "KING",
  "SOFA_BED",
  "BUNK_BED",
] as const;

export const roomSchema = z.object({
  name: z.string().trim().min(1).max(200),
  roomTypeLabel: z.string().trim().min(1).max(80),
  descriptionEn: z.string().trim().max(4000).optional().or(z.literal("")),
  descriptionFr: z.string().trim().max(4000).optional().or(z.literal("")),
  descriptionAr: z.string().trim().max(4000).optional().or(z.literal("")),
  maxGuests: z.number().int().min(1).max(20),
  maxAdults: z.number().int().min(1).max(20),
  maxChildren: z.number().int().min(0).max(10),
  bedTypes: z.array(z.enum(BED_TYPE_OPTIONS)).min(1),
  numberOfBeds: z.number().int().min(1).max(10),
  bathrooms: z.number().int().min(1).max(10),
  roomSizeSqm: z.number().min(0).max(2000).optional(),
  smokingAllowed: z.boolean(),
  accessible: z.boolean(),
  breakfastIncluded: z.boolean(),
  refundable: z.boolean(),
  basePrice: z.number().min(0),
  weekendPrice: z.number().min(0).optional(),
  taxRatePercent: z.number().min(0).max(100),
  cleaningFee: z.number().min(0),
  currency: z.enum(["MAD", "EUR", "USD"]),
  availableQuantity: z.number().int().min(0).max(500),
  minStay: z.number().int().min(1).max(90),
  maxStay: z.number().int().min(1).max(365).optional(),
  instantBooking: z.boolean(),
  amenityIds: z.array(z.string()),
});

export type RoomInput = z.infer<typeof roomSchema>;

export const seasonalPriceSchema = z.object({
  name: z.string().trim().max(80).optional().or(z.literal("")),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  price: z.number().min(0),
  weekendPrice: z.number().min(0).optional(),
});

export type SeasonalPriceInput = z.infer<typeof seasonalPriceSchema>;

export const blackoutDateSchema = z.object({
  date: z.string().min(1),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
});

export type BlackoutDateInput = z.infer<typeof blackoutDateSchema>;
