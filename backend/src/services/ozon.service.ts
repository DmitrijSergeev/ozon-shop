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

type SearchType = "offer_id" | "product_id" | "sku";

interface GetProductsParams {
    lastId?: string;
    limit?: number;
    search?: string;
    searchType?: SearchType;
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
            if (!/^\d+$/.test(value)) {
                throw new Error("product_id должен содержать только цифры");
            }

            filter.product_id = [Number(value)];
        }

        if (searchType === "sku") {
            if (!/^\d+$/.test(value)) {
                throw new Error("SKU должен содержать только цифры");
            }

            filter.skus = [Number(value)];
        }
    }

    console.log("🔎 Search:", value);
    console.log("🔎 Search type:", searchType);
    console.log("📄 Last ID:", lastId);
    console.log("📦 Limit:", limit);

    const response = await ozonApi.post("/v3/product/list", {
        filter,
        last_id: lastId,
        limit,
    });

    return response.data;
}