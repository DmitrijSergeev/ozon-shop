import { z } from "zod";

const boolParam = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

export const ozonProductsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  last_id: z.string().default(""),
  search: z.string().default(""),
  searchType: z.enum(["offer_id", "product_id", "sku"]).default("offer_id"),
  fbo: boolParam,
  fbs: boolParam,
  archived: boolParam,
  discounted: boolParam,
});

export type OzonProductsQuery = z.infer<typeof ozonProductsQuerySchema>;
