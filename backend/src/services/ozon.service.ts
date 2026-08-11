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

export interface GetProductsParams {
  lastId?: string;
  limit?: number;
  search?: string;
  searchType?: "offer_id" | "product_id" | "sku";

  fboOnly?: boolean;
  fbsOnly?: boolean;
  archivedOnly?: boolean;
  discountedOnly?: boolean;
}

export async function getOzonProducts({
  lastId = "",
  limit = 20,
  search = "",
  searchType = "offer_id",

  fboOnly = false,
  fbsOnly = false,
  archivedOnly = false,
  discountedOnly = false,
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
   * Поиск по offer_id / product_id / sku.
   */

  if (value) {
    switch (searchType) {
      case "offer_id":
        filter.offer_id = [value];
        break;

      case "product_id": {
        const productId = Number(value);

        if (!Number.isInteger(productId)) {
          throw new Error("product_id должен быть числом");
        }

        filter.product_id = [productId];
        break;
      }

      case "sku": {
        const sku = Number(value);

        if (!Number.isInteger(sku)) {
          throw new Error("sku должен быть числом");
        }

        filter.skus = [sku];
        break;
      }
    }
  }

  console.log("🔎 Search:", value);
  console.log("🔎 Search type:", searchType);
  console.log("📄 Last ID:", lastId);
  console.log("📦 Limit:", limit);

  /*
   * Получаем товары из Ozon.
   */

  const response = await ozonApi.post("/v3/product/list", {
    filter,
    last_id: lastId,
    limit,
  });

  let items = response.data?.result?.items ?? [];

  /*
   * Дополнительные фильтры.
   *
   * Эти признаки приходят в ответе Ozon:
   *
   * has_fbo_stocks
   * has_fbs_stocks
   * archived
   * is_discounted
   *
   * Поэтому фильтруем их после получения ответа.
   */

  if (fboOnly) {
    items = items.filter(
      (product: any) => product.has_fbo_stocks === true
    );
  }

  if (fbsOnly) {
    items = items.filter(
      (product: any) => product.has_fbs_stocks === true
    );
  }

  if (archivedOnly) {
    items = items.filter(
      (product: any) => product.archived === true
    );
  }

  if (discountedOnly) {
    items = items.filter(
      (product: any) => product.is_discounted === true
    );
  }

  /*
   * Возвращаем результат в том же формате,
   * который ожидает фронтенд.
   */

  return {
    ...response.data,

    result: {
      ...response.data.result,

      items,

      /*
       * total отражает количество товаров
       * после применения фильтров.
       */
      total: items.length,
    },
  };
}

