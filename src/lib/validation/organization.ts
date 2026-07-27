import { z } from "zod";
import { CURRENCIES } from "@/lib/currency/config";

export const organizationSchema = z.object({
  legalName: z
    .string()
    .trim()
    .min(1, { error: "required" })
    .max(200, { error: "tooLong:200" }),
  displayName: z
    .string()
    .trim()
    .min(1, { error: "required" })
    .max(200, { error: "tooLong:200" }),
  registrationNumber: z
    .string()
    .trim()
    .max(80, { error: "tooLong:80" })
    .optional()
    .or(z.literal("")),
  taxId: z
    .string()
    .trim()
    .max(80, { error: "tooLong:80" })
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(300, { error: "tooLong:300" })
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(30, { error: "tooLong:30" })
    .optional()
    .or(z.literal("")),
  email: z.email({ error: "invalidEmail" }).optional().or(z.literal("")),
  website: z.url({ error: "invalidUrl" }).optional().or(z.literal("")),
  baseCurrency: z.enum(CURRENCIES),
});

export type OrganizationInput = z.infer<typeof organizationSchema>;
