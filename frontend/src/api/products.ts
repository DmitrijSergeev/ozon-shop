import { apiFetch } from "./client";

export type ProductStatus = "ok" | "out_of_stock" | "low_stock" | "archived";

export interface ProductRow {
  id: string;
  ozonId: string;
  offerId: string;
  sku: number | null;
  name: string | null;
  price: number | null;
  oldPrice: number | null;
  stock: number;
  reserved: number;
  sales: number;
  revenue: number;
  archived: boolean;
  status: ProductStatus;
}

export interface ProductsPage {
  items: ProductRow[];
  total: number;
  limit: number;
  offset: number;
}

export type SortBy = "sales" | "revenue" | "price" | "stock";
export type SortOrder = "asc" | "desc";

export interface ProductsFilters {
  inStock: boolean;
  outOfStock: boolean;
  lowStock: boolean;
  selling: boolean;
  noSales: boolean;
  highPrice: boolean;
  lowPrice: boolean;
}

export interface GetProductsParams {
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  filters?: Partial<ProductsFilters>;
}

export async function getProducts(
  shopId: string,
  params: GetProductsParams = {},
): Promise<ProductsPage> {
  const {
    search = "",
    limit = 20,
    offset = 0,
    sortBy = "sales",
    sortOrder = "desc",
    filters = {},
  } = params;

  const query = new URLSearchParams();

  query.set("limit", String(limit));
  query.set("offset", String(offset));
  query.set("sortBy", sortBy);
  query.set("sortOrder", sortOrder);

  if (search.trim()) {
    query.set("search", search.trim());
  }

  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, "true");
  }

  return apiFetch<ProductsPage>(`/api/products/${shopId}?${query.toString()}`);
}
