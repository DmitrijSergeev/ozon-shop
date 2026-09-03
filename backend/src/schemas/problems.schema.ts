import { z } from "zod";

export const resolveProblemSchema = z.object({
  productId: z.string().min(1),
  type: z.string().min(1),
});

export type ResolveProblemInput = z.infer<typeof resolveProblemSchema>;
