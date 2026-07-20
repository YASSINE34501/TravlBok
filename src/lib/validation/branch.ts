import { z } from "zod";

export const branchSchema = z.object({
  name: z.string().trim().min(1).max(200),
  countryId: z.string().optional().or(z.literal("")),
  cityId: z.string().optional().or(z.literal("")),
  address: z.string().trim().min(1).max(300),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.email().optional().or(z.literal("")),
  isMainBranch: z.boolean(),
});

export type BranchInput = z.infer<typeof branchSchema>;
