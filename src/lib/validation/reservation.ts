import { z } from "zod";

export const paymentProviderSchema = z.enum([
  "STRIPE",
  "PAYPAL",
  "BANK_TRANSFER",
  "MANUAL",
  "CASH_AT_PROPERTY",
]);

export const hotelBookingSchema = z
  .object({
    roomTypeId: z.string().min(1, { error: "required" }),
    checkInDate: z.string().min(1, { error: "required" }),
    checkOutDate: z.string().min(1, { error: "required" }),
    quantity: z
      .number()
      .int({ error: "mustBeInteger" })
      .min(1, { error: "numberTooSmall:1" })
      .max(10, { error: "numberTooLarge:10" }),
    guestFirstName: z
      .string()
      .trim()
      .min(1, { error: "required" })
      .max(80, { error: "tooLong:80" }),
    guestLastName: z
      .string()
      .trim()
      .min(1, { error: "required" })
      .max(80, { error: "tooLong:80" }),
    guestEmail: z.email({ error: "invalidEmail" }),
    guestPhone: z
      .string()
      .trim()
      .max(30, { error: "tooLong:30" })
      .optional()
      .or(z.literal("")),
    specialRequests: z
      .string()
      .trim()
      .max(1000, { error: "tooLong:1000" })
      .optional()
      .or(z.literal("")),
    couponCode: z
      .string()
      .trim()
      .max(40, { error: "tooLong:40" })
      .optional()
      .or(z.literal("")),
    paymentProvider: paymentProviderSchema.default("CASH_AT_PROPERTY"),
  })
  .refine((data) => data.checkOutDate > data.checkInDate, {
    path: ["checkOutDate"],
    error: "invalidDateRange",
  });

export type HotelBookingInput = z.infer<typeof hotelBookingSchema>;

export const carBookingSchema = z
  .object({
    vehicleId: z.string().min(1, { error: "required" }),
    pickupAt: z.string().min(1, { error: "required" }),
    returnAt: z.string().min(1, { error: "required" }),
    pickupLocation: z
      .string()
      .trim()
      .max(200, { error: "tooLong:200" })
      .optional()
      .or(z.literal("")),
    dropoffLocation: z
      .string()
      .trim()
      .max(200, { error: "tooLong:200" })
      .optional()
      .or(z.literal("")),
    driverOptionRequested: z.boolean(),
    gpsRequested: z.boolean(),
    childSeatRequested: z.boolean(),
    airportDelivery: z.boolean(),
    guestFirstName: z
      .string()
      .trim()
      .min(1, { error: "required" })
      .max(80, { error: "tooLong:80" }),
    guestLastName: z
      .string()
      .trim()
      .min(1, { error: "required" })
      .max(80, { error: "tooLong:80" }),
    guestEmail: z.email({ error: "invalidEmail" }),
    guestPhone: z
      .string()
      .trim()
      .max(30, { error: "tooLong:30" })
      .optional()
      .or(z.literal("")),
    specialRequests: z
      .string()
      .trim()
      .max(1000, { error: "tooLong:1000" })
      .optional()
      .or(z.literal("")),
    couponCode: z
      .string()
      .trim()
      .max(40, { error: "tooLong:40" })
      .optional()
      .or(z.literal("")),
    paymentProvider: paymentProviderSchema.default("CASH_AT_PROPERTY"),
  })
  .refine((data) => data.returnAt > data.pickupAt, {
    path: ["returnAt"],
    error: "invalidDateRange",
  });

export type CarBookingInput = z.infer<typeof carBookingSchema>;
