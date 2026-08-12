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

export async function getOzonProducts({
                                          search = "",
                                          searchType = "offer_id",
                                          lastId = "",
                                          limit = 20,
                                          fbo = false,
                                          fbs = false,
                                          archived = false,
                                          discounted = false,
                                      }: GetOzonProductsParams = {}): Promise<OzonProductsResponse> {
    const params = new URLSearchParams();

    params.set("limit", String(limit));

    if (search.trim()) {
        params.set("search", search.trim());
        params.set("searchType", searchType);
    }

    if (lastId) {
        params.set("last_id", lastId);
    }

    if (fbo) {
        params.set("fbo", "true");
    }

    if (fbs) {
        params.set("fbs", "true");
    }

    if (archived) {
        params.set("archived", "true");
    }

    if (discounted) {
        params.set("discounted", "true");
    }

    const response = await fetch(
        `http://localhost:3000/api/ozon/products?${params.toString()}`
    );

    if (!response.ok) {
        throw new Error(
            "Не удалось получить товары Ozon"
        );
    }

    return response.json();
}

export async function getOzonProduct(
    productId: number
) {
    const response = await fetch(
        `http://localhost:3000/api/ozon/products/${productId}`
    );

    if (!response.ok) {
        throw new Error(
            "Не удалось загрузить товар"
        );
    }

    return response.json();
}