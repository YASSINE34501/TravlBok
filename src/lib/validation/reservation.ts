import { z } from "zod";

export const hotelBookingSchema = z
  .object({
    roomTypeId: z.string().min(1),
    checkInDate: z.string().min(1),
    checkOutDate: z.string().min(1),
    quantity: z.number().int().min(1).max(10),
    guestFirstName: z.string().trim().min(1).max(80),
    guestLastName: z.string().trim().min(1).max(80),
    guestEmail: z.email(),
    guestPhone: z.string().trim().max(30).optional().or(z.literal("")),
    specialRequests: z.string().trim().max(1000).optional().or(z.literal("")),
    couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  })
  .refine((data) => data.checkOutDate > data.checkInDate, {
    path: ["checkOutDate"],
    error: "invalidDateRange",
  });

export type HotelBookingInput = z.infer<typeof hotelBookingSchema>;

export const carBookingSchema = z
  .object({
    vehicleId: z.string().min(1),
    pickupAt: z.string().min(1),
    returnAt: z.string().min(1),
    pickupLocation: z.string().trim().max(200).optional().or(z.literal("")),
    dropoffLocation: z.string().trim().max(200).optional().or(z.literal("")),
    driverOptionRequested: z.boolean(),
    gpsRequested: z.boolean(),
    childSeatRequested: z.boolean(),
    airportDelivery: z.boolean(),
    guestFirstName: z.string().trim().min(1).max(80),
    guestLastName: z.string().trim().min(1).max(80),
    guestEmail: z.email(),
    guestPhone: z.string().trim().max(30).optional().or(z.literal("")),
    specialRequests: z.string().trim().max(1000).optional().or(z.literal("")),
    couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  })
  .refine((data) => data.returnAt > data.pickupAt, {
    path: ["returnAt"],
    error: "invalidDateRange",
  });

export type CarBookingInput = z.infer<typeof carBookingSchema>;
