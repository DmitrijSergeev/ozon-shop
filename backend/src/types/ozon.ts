export type SearchType = "offer_id" | "product_id" | "sku";

export interface ProductFilters {
  fbo?: boolean;
  fbs?: boolean;
  archived?: boolean;
  discounted?: boolean;
}

export interface OzonProduct {
  product_id: number;
  offer_id: string;
  has_fbo_stocks: boolean;
  has_fbs_stocks: boolean;
  archived: boolean;
  is_discounted: boolean;
  quants: unknown[];
  sku?: number;
}

export interface OzonProductsResult {
  items: OzonProduct[];
  total: number;
  last_id: string;
}

export interface OzonProductsResponse {
  result: OzonProductsResult;
}

export interface GetProductsParams extends ProductFilters {
  lastId?: string;
  limit?: number;
  search?: string;
  searchType?: SearchType;
}
