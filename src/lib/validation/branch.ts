import { z } from "zod";

export const branchSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "required" })
    .max(200, { error: "tooLong:200" }),
  countryId: z.string().optional().or(z.literal("")),
  cityId: z.string().optional().or(z.literal("")),
  address: z
    .string()
    .trim()
    .min(1, { error: "required" })
    .max(300, { error: "tooLong:300" }),
  phone: z
    .string()
    .trim()
    .max(30, { error: "tooLong:30" })
    .optional()
    .or(z.literal("")),
  email: z.email({ error: "invalidEmail" }).optional().or(z.literal("")),
  isMainBranch: z.boolean(),
});

export type BranchInput = z.infer<typeof branchSchema>;
