import { z } from "zod";

export const PARTNER_REGISTRATION_ROLES = [
  "CUSTOMER",
  "HOTEL_OWNER",
  "CAR_RENTAL_OWNER",
  "TRAVEL_AGENCY",
  "AFFILIATE_PARTNER",
] as const;

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.email().trim().toLowerCase(),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
    role: z.enum(PARTNER_REGISTRATION_ROLES),
    organizationName: z.string().trim().max(160).optional().or(z.literal("")),
    acceptTerms: z.boolean().refine((value) => value === true, {
      error: "mustAcceptTerms",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "passwordsDontMatch",
  })
  .refine(
    (data) =>
      data.role === "CUSTOMER" ||
      data.role === "AFFILIATE_PARTNER" ||
      (data.organizationName && data.organizationName.trim().length > 0),
    {
      path: ["organizationName"],
      error: "required",
    }
  );

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "passwordsDontMatch",
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
