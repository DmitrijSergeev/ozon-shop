import { z } from "zod";

export const ordersQuerySchema = z.object({
  dateFrom: z.string().optional().nullable().default(null),
  dateTo: z.string().optional().nullable().default(null),
  status: z.string().optional().nullable().default(null),
  productId: z.string().optional().nullable().default(null),
});

export type OrdersQuery = z.infer<typeof ordersQuerySchema>;
