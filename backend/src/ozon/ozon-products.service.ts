import type { AxiosInstance } from "axios";
import type { OzonListProduct, OzonPagedResult } from "./ozon.types.js";

const PAGE_LIMIT = 1000;
const MAX_PAGES = 100;

/**
 * Взаимодействие с товарами Ozon.
 *
 * Инкапсулирует эндпоинты `/v3/product/list` и `/v3/product/info/list`.
 * Бизнес-логика не должна знать о структуре этих запросов.
 */
export class OzonProductsService {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Получение всех товаров магазина (с курсорной пагинацией).
   */
  async listAll(): Promise<OzonListProduct[]> {
    const collected: OzonListProduct[] = [];
    let lastId = "";

    for (let page = 0; page < MAX_PAGES; page++) {
      const response = await this.client.post("/v3/product/list", {
        filter: { visibility: "ALL" },
        last_id: lastId,
        limit: PAGE_LIMIT,
      });

      const items: OzonListProduct[] = response.data?.result?.items ?? [];
      const nextLastId: string = response.data?.result?.last_id ?? "";

      collected.push(...items);

      if (!nextLastId) break;
      lastId = nextLastId;
    }

    return collected;
  }

  /**
   * Получение подробной информации о товаре по его Ozon product_id.
   */
  async getDetails(productId: number): Promise<Record<string, unknown> | null> {
    const response = await this.client.post("/v3/product/info/list", {
      product_id: [productId],
    });

    const items = response.data?.items ?? [];
    return items.length > 0 ? items[0] : null;
  }
}

/** Утилита курсорной пагинации для произвольного эндпоинта (остатки/цены). */
export async function fetchAllPages<T>(
  client: AxiosInstance,
  url: string,
  body: Record<string, unknown>,
  extract: (data: any) => OzonPagedResult<T>,
): Promise<T[]> {
  const collected: T[] = [];
  let lastId = "";

  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await client.post(url, {
      ...body,
      last_id: lastId,
      limit: PAGE_LIMIT,
    });
    const { items, lastId: nextLastId } = extract(response.data);

    collected.push(...items);

    if (!nextLastId) break;
    lastId = nextLastId;
  }

  return collected;
}
