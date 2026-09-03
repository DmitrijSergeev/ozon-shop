import { z } from "zod";

export const analyticsQuerySchema = z
  .object({
    period: z.enum(["today", "7d", "30d", "custom"]).default("30d"),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.period === "custom") {
        return Boolean(data.dateFrom && data.dateTo);
      }
      return true;
    },
    {
      message: "Для произвольного периода укажите dateFrom и dateTo",
      path: ["period"],
    },
  );

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
