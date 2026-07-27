import { z } from "zod";
import { CURRENCIES } from "@/lib/currency/config";

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
  name: z
    .string()
    .trim()
    .min(1, { error: "required" })
    .max(200, { error: "tooLong:200" }),
  roomTypeLabel: z
    .string()
    .trim()
    .min(1, { error: "required" })
    .max(80, { error: "tooLong:80" }),
  descriptionEn: z
    .string()
    .trim()
    .max(4000, { error: "tooLong:4000" })
    .optional()
    .or(z.literal("")),
  descriptionFr: z
    .string()
    .trim()
    .max(4000, { error: "tooLong:4000" })
    .optional()
    .or(z.literal("")),
  descriptionAr: z
    .string()
    .trim()
    .max(4000, { error: "tooLong:4000" })
    .optional()
    .or(z.literal("")),
  maxGuests: z
    .number()
    .int({ error: "mustBeInteger" })
    .min(1, { error: "numberTooSmall:1" })
    .max(20, { error: "numberTooLarge:20" }),
  maxAdults: z
    .number()
    .int({ error: "mustBeInteger" })
    .min(1, { error: "numberTooSmall:1" })
    .max(20, { error: "numberTooLarge:20" }),
  maxChildren: z
    .number()
    .int({ error: "mustBeInteger" })
    .min(0, { error: "numberTooSmall:0" })
    .max(10, { error: "numberTooLarge:10" }),
  bedTypes: z.array(z.enum(BED_TYPE_OPTIONS)).min(1, { error: "required" }),
  numberOfBeds: z
    .number()
    .int({ error: "mustBeInteger" })
    .min(1, { error: "numberTooSmall:1" })
    .max(10, { error: "numberTooLarge:10" }),
  bathrooms: z
    .number()
    .int({ error: "mustBeInteger" })
    .min(1, { error: "numberTooSmall:1" })
    .max(10, { error: "numberTooLarge:10" }),
  roomSizeSqm: z
    .number()
    .min(0, { error: "numberTooSmall:0" })
    .max(2000, { error: "numberTooLarge:2000" })
    .optional(),
  smokingAllowed: z.boolean(),
  accessible: z.boolean(),
  breakfastIncluded: z.boolean(),
  refundable: z.boolean(),
  basePrice: z.number().min(0, { error: "numberTooSmall:0" }),
  weekendPrice: z.number().min(0, { error: "numberTooSmall:0" }).optional(),
  taxRatePercent: z
    .number()
    .min(0, { error: "numberTooSmall:0" })
    .max(100, { error: "numberTooLarge:100" }),
  cleaningFee: z.number().min(0, { error: "numberTooSmall:0" }),
  currency: z.enum(CURRENCIES),
  availableQuantity: z
    .number()
    .int({ error: "mustBeInteger" })
    .min(0, { error: "numberTooSmall:0" })
    .max(500, { error: "numberTooLarge:500" }),
  minStay: z
    .number()
    .int({ error: "mustBeInteger" })
    .min(1, { error: "numberTooSmall:1" })
    .max(90, { error: "numberTooLarge:90" }),
  maxStay: z
    .number()
    .int({ error: "mustBeInteger" })
    .min(1, { error: "numberTooSmall:1" })
    .max(365, { error: "numberTooLarge:365" })
    .optional(),
  instantBooking: z.boolean(),
  amenityIds: z.array(z.string()),
  // Dynamic Pricing bounds — MASTER-PLAN's "never breach min/max prices".
  minPrice: z.number().min(0, { error: "numberTooSmall:0" }).optional(),
  maxPrice: z.number().min(0, { error: "numberTooSmall:0" }).optional(),
})
  .refine((data) => data.minPrice == null || data.maxPrice == null || data.maxPrice >= data.minPrice, {
    path: ["maxPrice"],
    error: "maxPriceBelowMin",
  });

export type RoomInput = z.infer<typeof roomSchema>;

export const seasonalPriceSchema = z.object({
  name: z
    .string()
    .trim()
    .max(80, { error: "tooLong:80" })
    .optional()
    .or(z.literal("")),
  startDate: z.string().min(1, { error: "required" }),
  endDate: z.string().min(1, { error: "required" }),
  price: z.number().min(0, { error: "numberTooSmall:0" }),
  weekendPrice: z.number().min(0, { error: "numberTooSmall:0" }).optional(),
});

export type SeasonalPriceInput = z.infer<typeof seasonalPriceSchema>;

export const blackoutDateSchema = z.object({
  date: z.string().min(1, { error: "required" }),
  reason: z
    .string()
    .trim()
    .max(200, { error: "tooLong:200" })
    .optional()
    .or(z.literal("")),
});

export type BlackoutDateInput = z.infer<typeof blackoutDateSchema>;
