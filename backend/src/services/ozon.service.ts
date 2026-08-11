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

interface GetProductsParams {
    lastId?: string;
    limit?: number;
    search?: string;
    searchType?: "offer_id" | "product_id" | "sku";
}

export async function getOzonProducts({
    lastId = "",
    limit = 20,
    search = "",
    searchType = "offer_id",
}: GetProductsParams = {}) {
    console.log("➡️ Запрос списка товаров Ozon");

    const value = search.trim();

    const filter: {
        visibility: string;
        offer_id?: string[];
        product_id?: number[];
        skus?: number[];
    } = {
        visibility: "ALL",
    };

    if (value) {
        if (searchType === "offer_id") {
            filter.offer_id = [value];
        }

        if (searchType === "product_id") {
            filter.product_id = [Number(value)];
        }

        if (searchType === "sku") {
            filter.skus = [Number(value)];
        }
    }

    const response = await ozonApi.post("/v3/product/list", {
        filter,
        last_id: lastId,
        limit,
    });

    return response.data;
}


/**
 * Получение подробной информации об одном товаре.
 *
 * Ozon позволяет искать товар по:
 * - product_id
 * - offer_id
 * - sku
 */
export async function getOzonProductById(productId: number) {
    console.log("➡️ Запрос информации о товаре:", productId);

    const response = await ozonApi.post("/v3/product/info/list", {
        product_id: [String(productId)],
    });

    return response.data;
}
