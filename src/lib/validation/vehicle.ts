import { z } from "zod";

export const vehicleSchema = z.object({
  branchId: z.string().min(1),
  categoryId: z.string().optional().or(z.literal("")),
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80),
  year: z.number().int().min(1990).max(2100),
  color: z.string().trim().max(40).optional().or(z.literal("")),
  fuel: z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "LPG"]),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]),
  seats: z.number().int().min(1).max(20),
  doors: z.number().int().min(1).max(6),
  engine: z.string().trim().max(60).optional().or(z.literal("")),
  registrationReference: z.string().trim().max(60).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(4000).optional().or(z.literal("")),
  descriptionFr: z.string().trim().max(4000).optional().or(z.literal("")),
  descriptionAr: z.string().trim().max(4000).optional().or(z.literal("")),
  pricePerDay: z.number().min(0),
  currency: z.enum(["MAD", "EUR", "USD"]),
  deposit: z.number().min(0).optional(),
  mileagePolicy: z.enum(["UNLIMITED", "LIMITED"]),
  mileageLimitKm: z.number().int().min(0).optional(),
  fuelPolicy: z.enum(["FULL_TO_FULL", "FULL_TO_EMPTY", "SAME_TO_SAME"]),
  driverOptionAvailable: z.boolean(),
  gpsAvailable: z.boolean(),
  childSeatAvailable: z.boolean(),
  airportDeliveryAvailable: z.boolean(),
  status: z.enum(["AVAILABLE", "RESERVED", "RENTED", "MAINTENANCE", "INACTIVE"]),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
