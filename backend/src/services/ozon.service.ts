import "dotenv/config";
import axios from "axios";

import type {
  GetProductsParams,
  OzonProduct,
  OzonProductsResponse,
  ProductFilters,
} from "../types/ozon.js";

const OZON_MAX_PAGES = 100;
const OZON_FETCH_LIMIT = 1000;

// Поддержка обоих вариантов имён переменных: каноничные OZON_* и
// устаревшие без префикса. Позволяет коду работать со старым .env,
// пока ключи не перенесены на OZON_CLIENT_ID / OZON_API_KEY.
const ozonClientId = process.env.OZON_CLIENT_ID ?? process.env.Client_ID;
const ozonApiKey = process.env.OZON_API_KEY ?? process.env.API_Key;

export const ozonApi = axios.create({
  baseURL: "https://api-seller.ozon.ru",
  headers: {
    "Client-Id": ozonClientId,
    "Api-Key": ozonApiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

interface ListFilter {
  visibility: string;
  offer_id?: string[];
  product_id?: number[];
}

function matchesFilters(
  product: OzonProduct,
  filters: ProductFilters,
): boolean {
  if (filters.fbo && !product.has_fbo_stocks) return false;
  if (filters.fbs && !product.has_fbs_stocks) return false;
  if (filters.archived && !product.archived) return false;
  if (filters.discounted && !product.is_discounted) return false;

  return true;
}

function emptyResult(): OzonProductsResponse {
  return {
    result: {
      items: [],
      total: 0,
      last_id: "",
    },
  };
}

/**
 * Получение списка товаров Ozon.
 *
 * Ozon отдаёт cursor pagination через last_id. Если включены наши
 * фильтры или поиск по SKU, мы не ограничиваем первый запрос 20
 * товарами — иначе можно получить страницу, в которой почти все
 * товары отфильтрованы. Поэтому при локальной фильтрации забираем
 * большие пачки Ozon, пока не наберём limit подходящих товаров.
 */
export async function getOzonProducts(
  params: GetProductsParams = {},
): Promise<OzonProductsResponse> {
  const {
    lastId = "",
    limit = 20,
    search = "",
    searchType = "offer_id",
    fbo = false,
    fbs = false,
    archived = false,
    discounted = false,
  } = params;

  const value = search.trim();

  const filter: ListFilter = { visibility: "ALL" };

  if (value && searchType === "offer_id") {
    filter.offer_id = [value];
  }

  if (value && searchType === "product_id") {
    const productId = Number(value);

    if (!Number.isInteger(productId)) {
      return emptyResult();
    }

    filter.product_id = [productId];
  }

  const searchSku =
    value && searchType === "sku" ? Number(value) : null;

  const filters: ProductFilters = { fbo, fbs, archived, discounted };

  const needLocalFiltering =
    fbo || fbs || archived || discounted || searchSku !== null;

  if (!needLocalFiltering) {
    const response = await ozonApi.post<OzonProductsResponse>(
      "/v3/product/list",
      { filter, last_id: lastId, limit },
    );

    return response.data;
  }

  const collected: OzonProduct[] = [];
  let currentLastId = lastId;

  for (let page = 0; page < OZON_MAX_PAGES; page++) {
    const response = await ozonApi.post<OzonProductsResponse>(
      "/v3/product/list",
      { filter, last_id: currentLastId, limit: OZON_FETCH_LIMIT },
    );

    const items = response.data?.result?.items ?? [];
    const nextLastId = response.data?.result?.last_id ?? "";

    for (const product of items) {
      const skuMatches =
        searchSku === null || Number(product.sku) === searchSku;

      if (skuMatches && matchesFilters(product, filters)) {
        collected.push(product);

        if (collected.length >= limit) {
          return {
            result: {
              items: collected.slice(0, limit),
              total: collected.length,
              last_id: nextLastId,
            },
          };
        }
      }
    }

    if (!nextLastId) {
      return {
        result: {
          items: collected,
          total: collected.length,
          last_id: "",
        },
      };
    }

    currentLastId = nextLastId;
  }

  return {
    result: {
      items: collected.slice(0, limit),
      total: collected.length,
      last_id: currentLastId,
    },
  };
}

export async function getOzonProductDetails(productId: number) {
  const response = await ozonApi.post("/v3/product/info/list", {
    product_id: [productId],
  });

  return response.data;
}
