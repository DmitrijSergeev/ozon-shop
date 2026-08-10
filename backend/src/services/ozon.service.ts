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
}

export async function getOzonProducts({
                                          lastId = "",
                                          limit = 20,
                                          search = "",
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

    /*
     * Поиск по offer_id, product_id или sku.
     *
     * Ozon позволяет передавать только один тип
     * идентификатора за один запрос.
     */

    if (value) {
        // Если введено число
        if (/^\d+$/.test(value)) {
            const id = Number(value);

            /*
             * Здесь есть неоднозначность:
             * число может быть product_id или sku.
             *
             * Поэтому сначала ищем по product_id.
             * Если понадобится поиск именно по SKU,
             * фронтенд будет передавать отдельный тип поиска.
             */
            filter.product_id = [id];
        } else {
            // Строка — ищем по offer_id
            filter.offer_id = [value];
        }
    }

    const response = await ozonApi.post("/v3/product/list", {
        filter,
        last_id: lastId,
        limit,
    });

    return response.data;
}