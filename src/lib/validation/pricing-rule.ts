import { z } from "zod";

export const pricingRuleFactorSchema = z.enum([
  "SEASON",
  "DAY_OF_WEEK",
  "WEEKEND",
  "HOLIDAY",
  "SPECIAL_EVENT",
  "OCCUPANCY",
  "REMAINING_INVENTORY",
  "BOOKING_WINDOW",
  "LENGTH_OF_STAY",
  "DEMAND_LEVEL",
]);

export const pricingRuleSchema = z
  .object({
    hotelId: z.string().min(1, { error: "required" }),
    roomTypeId: z
      .string()
      .min(1, { error: "required" })
      .optional()
      .or(z.literal("")),
    name: z
      .string()
      .trim()
      .min(1, { error: "required" })
      .max(120, { error: "tooLong:120" }),
    description: z
      .string()
      .trim()
      .max(500, { error: "tooLong:500" })
      .optional()
      .or(z.literal("")),
    factor: pricingRuleFactorSchema,
    comparisonOperator: z.enum(["GTE", "LTE"]).optional(),
    thresholdValue: z
      .number()
      .min(0, { error: "numberTooSmall:0" })
      .max(9999, { error: "numberTooLarge:9999" })
      .optional(),
    daysOfWeek: z
      .array(
        z
          .number()
          .int({ error: "mustBeInteger" })
          .min(0, { error: "numberTooSmall:0" })
          .max(6, { error: "numberTooLarge:6" })
      )
      .max(7, { error: "tooLong:7" })
      .optional(),
    dateRangeStart: z.string().optional().or(z.literal("")),
    dateRangeEnd: z.string().optional().or(z.literal("")),
    demandLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    adjustmentType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    adjustmentValue: z
      .number()
      .min(-100, { error: "numberTooSmall:-100" })
      .max(100000, { error: "numberTooLarge:100000" }),
    priority: z
      .number()
      .int({ error: "mustBeInteger" })
      .min(0, { error: "numberTooSmall:0" })
      .max(1000, { error: "numberTooLarge:1000" })
      .default(0),
    activeFrom: z.string().optional().or(z.literal("")),
    activeTo: z.string().optional().or(z.literal("")),
    requiresApproval: z.boolean().default(false),
  })
  .refine(
    (data) =>
      !["OCCUPANCY", "REMAINING_INVENTORY", "BOOKING_WINDOW", "LENGTH_OF_STAY"].includes(
        data.factor
      ) ||
      (data.comparisonOperator != null && data.thresholdValue != null),
    { path: ["thresholdValue"], error: "thresholdRequired" }
  )
  .refine((data) => data.factor !== "DAY_OF_WEEK" || (data.daysOfWeek && data.daysOfWeek.length > 0), {
    path: ["daysOfWeek"],
    error: "daysOfWeekRequired",
  })
  .refine(
    (data) =>
      !["SEASON", "HOLIDAY", "SPECIAL_EVENT"].includes(data.factor) ||
      (!!data.dateRangeStart && !!data.dateRangeEnd),
    { path: ["dateRangeStart"], error: "dateRangeRequired" }
  )
  .refine((data) => data.factor !== "DEMAND_LEVEL" || !!data.demandLevel, {
    path: ["demandLevel"],
    error: "demandLevelRequired",
  });

export type PricingRuleInput = z.infer<typeof pricingRuleSchema>;
