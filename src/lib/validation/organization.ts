import { z } from "zod";

export const organizationSchema = z.object({
  legalName: z.string().trim().min(1).max(200),
  displayName: z.string().trim().min(1).max(200),
  registrationNumber: z.string().trim().max(80).optional().or(z.literal("")),
  taxId: z.string().trim().max(80).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.email().optional().or(z.literal("")),
  website: z.url().optional().or(z.literal("")),
  baseCurrency: z.enum(["MAD", "EUR", "USD"]),
});

export type OrganizationInput = z.infer<typeof organizationSchema>;
