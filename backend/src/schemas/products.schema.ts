import { z } from "zod";

const boolParam = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

export const productsQuerySchema = z.object({
  search: z.string().default(""),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  // Фильтры
  inStock: boolParam,
  outOfStock: boolParam,
  lowStock: boolParam,
  selling: boolParam,
  noSales: boolParam,
  highPrice: boolParam,
  lowPrice: boolParam,
  // Сортировка
  sortBy: z
    .enum(["sales", "revenue", "price", "stock"])
    .default("sales"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ProductsQuery = z.infer<typeof productsQuerySchema>;
