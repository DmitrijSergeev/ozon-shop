import { z } from "zod";

export const stocksQuerySchema = z.object({
  withinDays: z
    .enum(["3", "7", "14", "30"])
    .optional()
    .transform((value) => (value ? Number(value) : null)),
});

export type StocksQuery = z.infer<typeof stocksQuerySchema>;
