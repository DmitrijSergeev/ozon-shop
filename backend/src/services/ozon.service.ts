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

export interface ProductFilters {
    fbo?: boolean;
    fbs?: boolean;
    archived?: boolean;
    discounted?: boolean;
}

interface GetProductsParams extends ProductFilters {
    lastId?: string;
    limit?: number;
    search?: string;
    searchType?: SearchType;
}

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

interface OzonProductsResponse {
    result: {
        items: OzonProduct[];
        total: number;
        last_id: string;
    };
}

/**
 * Проверяем, подходит ли товар под выбранные фильтры.
 */
function matchesFilters(
    product: OzonProduct,
    filters: ProductFilters,
): boolean {
    if (
        filters.fbo &&
        !product.has_fbo_stocks
    ) {
        return false;
    }

    if (
        filters.fbs &&
        !product.has_fbs_stocks
    ) {
        return false;
    }

    if (
        filters.archived &&
        !product.archived
    ) {
        return false;
    }

    if (
        filters.discounted &&
        !product.is_discounted
    ) {
        return false;
    }

    return true;
}

/**
 * Проверяет, есть ли вообще активные фильтры.
 */
function hasFilters(
    filters: ProductFilters,
): boolean {
    return Boolean(
        filters.fbo ||
        filters.fbs ||
        filters.archived ||
        filters.discounted,
    );
}

/**
 * Получение списка товаров Ozon.
 *
 * Важный момент:
 *
 * Ozon отдаёт cursor pagination через last_id.
 *
 * Если фильтры включены, мы НЕ ограничиваем
 * первый запрос 20 товарами.
 *
 * Иначе можем получить:
 *
 * 20 товаров Ozon
 * ↓
 * только 2 подходят под FBO
 *
 * и ошибочно показать пользователю только 2 товара.
 *
 * Поэтому при наличии фильтров получаем большие
 * пачки Ozon и продолжаем запрашивать следующие
 * страницы, пока не наберём 20 подходящих товаров.
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
                                      }: GetProductsParams = {}) {
    console.log("➡️ Запрос списка товаров Ozon");

    const value = search.trim();

    const filter: {
        visibility: string;
        offer_id?: string[];
        product_id?: number[];
    } = {
        visibility: "ALL",
    };

    /*
     * Поиск по offer_id
     */
    if (
        value &&
        searchType === "offer_id"
    ) {
        filter.offer_id = [value];
    }

    /*
     * Поиск по product_id
     */
    if (
        value &&
        searchType === "product_id"
    ) {
        const productId = Number(value);

        if (!Number.isInteger(productId)) {
            return {
                result: {
                    items: [],
                    total: 0,
                    last_id: "",
                },
            };
        }

        filter.product_id = [productId];
    }

    /*
     * Для SKU используем последующую фильтрацию.
     */
    const searchSku =
        value &&
        searchType === "sku"
            ? Number(value)
            : null;

    /*
     * Запрашиваем товары.
     *
     * Если есть наши фильтры или поиск SKU,
     * берём большую пачку и фильтруем её.
     *
     * Если фильтров нет — обычная пагинация
     * по 20 товаров.
     */
    const needLocalFiltering =
        fbo ||
        fbs ||
        archived ||
        discounted ||
        searchSku !== null;

    if (!needLocalFiltering) {
        const response =
            await ozonApi.post(
                "/v3/product/list",
                {
                    filter,
                    last_id: lastId,
                    limit,
                },
            );

        return response.data;
    }

    /*
     * Здесь будем собирать страницу.
     */
    const result: any[] = [];

    let currentLastId = lastId;

    /*
     * Защита от бесконечного цикла.
     */
    for (let i = 0; i < 100; i++) {
        const response =
            await ozonApi.post(
                "/v3/product/list",
                {
                    filter,
                    last_id: currentLastId,
                    limit: 1000,
                },
            );

        const items =
            response.data?.result?.items || [];

        const nextLastId =
            response.data?.result?.last_id || "";

        console.log(
            `📦 Ozon вернул товаров: ${items.length}`,
        );

        /*
         * Фильтруем текущую пачку.
         */
        for (const product of items) {
            /*
             * SKU
             */
            if (
                searchSku !== null &&
                Number(product.sku) !== searchSku
            ) {
                continue;
            }

            /*
             * FBO
             */
            if (
                fbo &&
                !product.has_fbo_stocks
            ) {
                continue;
            }

            /*
             * FBS
             */
            if (
                fbs &&
                !product.has_fbs_stocks
            ) {
                continue;
            }

            /*
             * Архив
             */
            if (
                archived &&
                !product.archived
            ) {
                continue;
            }

            /*
             * Скидка
             */
            if (
                discounted &&
                !product.is_discounted
            ) {
                continue;
            }

            result.push(product);

            /*
             * Нам уже достаточно товаров
             * для одной страницы.
             */
            if (result.length >= limit) {
                break;
            }
        }

        /*
         * Если уже набрали страницу —
         * возвращаем результат.
         */
        if (result.length >= limit) {
            return {
                result: {
                    items: result.slice(0, limit),
                    total: result.length,
                    last_id: nextLastId,
                },
            };
        }

        /*
         * Ozon больше ничего не дал.
         */
        if (!nextLastId) {
            return {
                result: {
                    items: result,
                    total: result.length,
                    last_id: "",
                },
            };
        }

        /*
         * Переходим к следующей пачке Ozon.
         */
        currentLastId = nextLastId;
    }

    /*
     * Защитное завершение.
     */
    return {
        result: {
            items: result.slice(0, limit),
            total: result.length,
            last_id: currentLastId,
        },
    };
}
export async function getOzonProductDetails(
    productId: number,
) {
    console.log(
        `➡️ Запрос подробной информации о товаре Ozon: ${productId}`,
    );

    const response =
        await ozonApi.post(
            "/v3/product/info/list",
            {
                product_id: [productId],
            },
        );

    return response.data;
}