import { z } from "zod";
import { CURRENCIES } from "@/lib/currency/config";

export const vehicleSchema = z.object({
  branchId: z.string().min(1, { error: "required" }),
  categoryId: z.string().optional().or(z.literal("")),
  brand: z
    .string()
    .trim()
    .min(1, { error: "required" })
    .max(80, { error: "tooLong:80" }),
  model: z
    .string()
    .trim()
    .min(1, { error: "required" })
    .max(80, { error: "tooLong:80" }),
  year: z
    .number()
    .int({ error: "mustBeInteger" })
    .min(1990, { error: "numberTooSmall:1990" })
    .max(2100, { error: "numberTooLarge:2100" }),
  color: z
    .string()
    .trim()
    .max(40, { error: "tooLong:40" })
    .optional()
    .or(z.literal("")),
  fuel: z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "LPG"]),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]),
  seats: z
    .number()
    .int({ error: "mustBeInteger" })
    .min(1, { error: "numberTooSmall:1" })
    .max(20, { error: "numberTooLarge:20" }),
  doors: z
    .number()
    .int({ error: "mustBeInteger" })
    .min(1, { error: "numberTooSmall:1" })
    .max(6, { error: "numberTooLarge:6" }),
  engine: z
    .string()
    .trim()
    .max(60, { error: "tooLong:60" })
    .optional()
    .or(z.literal("")),
  registrationReference: z
    .string()
    .trim()
    .max(60, { error: "tooLong:60" })
    .optional()
    .or(z.literal("")),
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
  pricePerDay: z.number().min(0, { error: "numberTooSmall:0" }),
  currency: z.enum(CURRENCIES),
  deposit: z.number().min(0, { error: "numberTooSmall:0" }).optional(),
  insuranceExpiryAt: z.string().optional().or(z.literal("")),
  lastMaintenanceAt: z.string().optional().or(z.literal("")),
  nextMaintenanceDueAt: z.string().optional().or(z.literal("")),
  mileagePolicy: z.enum(["UNLIMITED", "LIMITED"]),
  mileageLimitKm: z
    .number()
    .int({ error: "mustBeInteger" })
    .min(0, { error: "numberTooSmall:0" })
    .optional(),
  fuelPolicy: z.enum(["FULL_TO_FULL", "FULL_TO_EMPTY", "SAME_TO_SAME"]),
  driverOptionAvailable: z.boolean(),
  gpsAvailable: z.boolean(),
  childSeatAvailable: z.boolean(),
  airportDeliveryAvailable: z.boolean(),
  status: z.enum(["AVAILABLE", "RESERVED", "RENTED", "MAINTENANCE", "INACTIVE"]),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
