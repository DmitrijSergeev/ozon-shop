import { z } from "zod";

export const priceUpdateItemSchema = z.object({
  productId: z.string().min(1),
  price: z.number().positive(),
});

export const updatePricesSchema = z.object({
  updates: z.array(priceUpdateItemSchema).min(1).max(1000),
});

export type UpdatePricesInput = z.infer<typeof updatePricesSchema>;
