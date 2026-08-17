import { z } from "zod";

export const createProductSchema = z.object({
  ozonId: z.string().min(1),
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  price: z.number().positive(),
  image: z.string().url().optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
