export type SearchType =
    | "offer_id"
    | "product_id"
    | "sku";

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

interface OzonProductsResponse {
  result: {
    items: OzonProduct[];
    total: number;
    last_id: string;
  };
}

interface GetOzonProductsParams {
  search?: string;
  searchType?: SearchType;
  lastId?: string;
}

export async function getOzonProducts({
                                        search = "",
                                        searchType = "offer_id",
                                        lastId = "",
                                      }: GetOzonProductsParams = {}): Promise<OzonProductsResponse> {
  const params = new URLSearchParams();

  params.set("limit", "20");

  if (search.trim()) {
    params.set("search", search.trim());
    params.set("searchType", searchType);
  }

  if (lastId) {
    params.set("last_id", lastId);
  }

  const response = await fetch(
      `http://localhost:3000/api/ozon/products?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Не удалось получить товары Ozon");
  }

  return response.json();
}
// 3076676743