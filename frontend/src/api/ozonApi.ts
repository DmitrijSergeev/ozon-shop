export type SearchType = "offer_id" | "product_id" | "sku";

export interface OzonProduct {
  product_id: number;
  offer_id: string;
  has_fbo_stocks: boolean;
  has_fbs_stocks: boolean;
  archived: boolean;
  is_discounted: boolean;
  quants: unknown[];
  sku: number;
}

export interface OzonProductsResponse {
  result: {
    items: OzonProduct[];
    total: number;
    last_id: string;
  };
}

export interface GetOzonProductsParams {
  search?: string;
  searchType?: SearchType;
  lastId?: string;
  limit?: number;
  fbo?: boolean;
  fbs?: boolean;
  archived?: boolean;
  discounted?: boolean;
}

export interface Commission {
  delivery_amount?: number;
  percent?: number;
  return_amount?: number;
  sale_schema?: string;
  value?: number;
}

export interface Stock {
  present: number;
  reserved: number;
  sku: number;
  source: string;
}

export interface ProductDetailsData {
  id: number;
  name: string;
  offer_id: string;
  is_archived: boolean;
  is_autoarchived: boolean;
  barcodes: string[];
  created_at: string;
  updated_at: string;
  images: string[];
  primary_image: string[];
  currency_code: string;
  min_price: string;
  old_price: string;
  price: string;
  sku: number;
  volume_weight: number;
  vat: string;
  is_discounted: boolean;
  discounted_fbo_stocks: number;
  has_discounted_fbo_item: boolean;
  stocks: {
    has_stock: boolean;
    stocks: Stock[];
  };
  commissions: Commission[];
  statuses?: {
    status: string;
    status_failed: string;
    moderate_status: string;
    validation_status: string;
    status_name: string;
    status_description: string;
    status_tooltip: string;
    is_created: boolean;
    status_updated_at: string;
  };
  visibility_details?: {
    has_price: boolean;
    has_stock: boolean;
  };
}

export async function getOzonProducts(
  params: GetOzonProductsParams = {},
): Promise<OzonProductsResponse> {
  const {
    search = "",
    searchType = "offer_id",
    lastId = "",
    limit = 20,
    fbo = false,
    fbs = false,
    archived = false,
    discounted = false,
  } = params;

  const query = new URLSearchParams();

  query.set("limit", String(limit));

  if (search.trim()) {
    query.set("search", search.trim());
    query.set("searchType", searchType);
  }

  if (lastId) query.set("last_id", lastId);
  if (fbo) query.set("fbo", "true");
  if (fbs) query.set("fbs", "true");
  if (archived) query.set("archived", "true");
  if (discounted) query.set("discounted", "true");

  const response = await fetch(`/api/ozon/products?${query.toString()}`);

  if (!response.ok) {
    throw new Error("Не удалось получить товары Ozon");
  }

  return response.json();
}

export async function getOzonProduct(
  productId: number,
): Promise<ProductDetailsData> {
  const response = await fetch(`/api/ozon/products/${productId}`);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Не удалось загрузить товар");
  }

  return response.json();
}
