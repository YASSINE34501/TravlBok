import { z } from "zod";

export const PARTNER_REGISTRATION_ROLES = [
  "CUSTOMER",
  "HOTEL_OWNER",
  "CAR_RENTAL_OWNER",
  "TRAVEL_AGENCY",
  "AFFILIATE_PARTNER",
] as const;

/** Role choices shown on the partner registration form only — never includes CUSTOMER. */
export const PARTNER_ONLY_ROLES = [
  "HOTEL_OWNER",
  "CAR_RENTAL_OWNER",
  "TRAVEL_AGENCY",
  "AFFILIATE_PARTNER",
] as const;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, { error: "required" })
      .max(80, { error: "tooLong:80" }),
    lastName: z
      .string()
      .trim()
      .min(1, { error: "required" })
      .max(80, { error: "tooLong:80" }),
    email: z.email({ error: "invalidEmail" }).trim().toLowerCase(),
    phone: z
      .string()
      .trim()
      .max(30, { error: "tooLong:30" })
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, { error: "passwordMin" })
      .max(72, { error: "tooLong:72" }),
    confirmPassword: z
      .string()
      .min(8, { error: "passwordMin" })
      .max(72, { error: "tooLong:72" }),
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
  email: z.email({ error: "invalidEmail" }).trim().toLowerCase(),
  password: z.string().min(1, { error: "required" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "invalidEmail" }).trim().toLowerCase(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, { error: "required" }),
    password: z
      .string()
      .min(8, { error: "passwordMin" })
      .max(72, { error: "tooLong:72" }),
    confirmPassword: z
      .string()
      .min(8, { error: "passwordMin" })
      .max(72, { error: "tooLong:72" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "passwordsDontMatch",
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
