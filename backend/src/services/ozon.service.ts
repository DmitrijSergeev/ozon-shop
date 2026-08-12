import "dotenv/config";
import axios from "axios";

export const ozonApi = axios.create({
    baseURL: "https://api-seller.ozon.ru",

    headers: {
        "Client-Id": process.env.Client_ID,
        "Api-Key": process.env.API_Key,
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

export type SearchType =
    | "offer_id"
    | "product_id"
    | "sku";

interface GetProductsParams {
    lastId?: string;
    limit?: number;
    search?: string;
    searchType?: SearchType;

    fbo?: boolean;
    fbs?: boolean;
    archived?: boolean;
    discounted?: boolean;
}

/*
 * Товар из /v3/product/list
 */
interface OzonProduct {
    product_id: number;
    offer_id: string;

    has_fbo_stocks: boolean;
    has_fbs_stocks: boolean;

    archived: boolean;
    is_discounted: boolean;

    quants: unknown[];

    sku?: number;
}

/*
 * Ответ Ozon
 */
interface OzonProductsResponse {
    result: {
        items: OzonProduct[];
        total: number;
        last_id: string;
    };
}

/**
 * Получение списка товаров Ozon.
 *
 * Поддерживает:
 *
 * search
 * searchType
 * lastId
 * limit
 *
 * fbo
 * fbs
 * archived
 * discounted
 */
export async function getOzonProducts({
                                          lastId = "",
                                          limit = 20,
                                          search = "",
                                          searchType = "offer_id",

                                          fbo = false,
                                          fbs = false,
                                          archived = false,
                                          discounted = false,
                                      }: GetProductsParams = {}): Promise<OzonProductsResponse> {
    console.log("➡️ Запрос списка товаров Ozon");

    console.log("🔎 Search:", search);
    console.log("🔎 Search type:", searchType);

    console.log("📄 Last ID:", lastId);
    console.log("📦 Limit:", limit);

    console.log("🔵 FBO:", fbo);
    console.log("🟢 FBS:", fbs);
    console.log("📦 Archived:", archived);
    console.log("🏷️ Discounted:", discounted);

    const value = search.trim();

    /*
     * ---------------------------------------------------------
     * Формируем filter для Ozon
     * ---------------------------------------------------------
     */

    const filter: {
        visibility: string;
        offer_id?: string[];
        product_id?: number[];
        skus?: number[];
    } = {
        /*
         * Если нужен архив —
         * используем специальную видимость Ozon.
         *
         * В остальных случаях ALL.
         */
        visibility: archived
            ? "ARCHIVED"
            : "ALL",
    };

    /*
     * ---------------------------------------------------------
     * Поиск
     * ---------------------------------------------------------
     *
     * Ozon позволяет использовать идентификаторы
     * для фильтрации списка.
     */

    if (value) {
        if (searchType === "offer_id") {
            filter.offer_id = [value];
        }

        if (searchType === "product_id") {
            const productId = Number(value);

            if (!Number.isNaN(productId)) {
                filter.product_id = [productId];
            }
        }

        if (searchType === "sku") {
            const sku = Number(value);

            if (!Number.isNaN(sku)) {
                filter.skus = [sku];
            }
        }
    }

    /*
     * ---------------------------------------------------------
     * Запрашиваем товары у Ozon
     * ---------------------------------------------------------
     */

    const response = await ozonApi.post<OzonProductsResponse>(
        "/v3/product/list",
        {
            filter,
            last_id: lastId,
            limit,
        },
    );

    const data = response.data;

    /*
     * ---------------------------------------------------------
     * Фильтрация FBO / FBS / скидки
     * ---------------------------------------------------------
     *
     * Эти признаки приходят непосредственно в элементах
     * ответа /v3/product/list.
     *
     * Поэтому фильтруем их здесь, на backend.
     */

    let items = data.result.items;

    if (fbo) {
        items = items.filter(
            (product) => product.has_fbo_stocks,
        );
    }

    if (fbs) {
        items = items.filter(
            (product) => product.has_fbs_stocks,
        );
    }

    if (discounted) {
        items = items.filter(
            (product) => product.is_discounted,
        );
    }

    /*
     * ---------------------------------------------------------
     * Защита от ситуации с archived
     * ---------------------------------------------------------
     *
     * visibility=ARCHIVED уже запрашивает архивные товары.
     *
     * Дополнительная проверка делает поведение очевидным
     * и защищает нас от неожиданных данных API.
     */

    if (archived) {
        items = items.filter(
            (product) => product.archived,
        );
    }

    /*
     * ---------------------------------------------------------
     * Возвращаем тот же формат, который уже использует frontend
     * ---------------------------------------------------------
     */

    return {
        result: {
            items,
            total: items.length,
            last_id: data.result.last_id || "",
        },
    };
}

/**
 * Получение подробной информации о товаре.
 *
 * Ozon:
 * POST /v3/product/info/list
 */
export async function getOzonProductDetails(
    productId: number,
) {
    console.log(
        `➡️ Запрос подробной информации о товаре Ozon: ${productId}`,
    );

    const response = await ozonApi.post(
        "/v3/product/info/list",
        {
            product_id: [productId],
        },
    );

    return response.data;
}