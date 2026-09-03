import type { AxiosInstance } from "axios";
import type { OzonStockItem } from "./ozon.types.js";
import { fetchAllPages } from "./ozon-products.service.js";

/**
 * Взаимодействие с остатками Ozon.
 *
 * Инкапсулирует эндпоинт `/v4/product/info/stocks`.
 */
export class OzonStocksService {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Получение остатков по всем товарам магазина.
   */
  async listAll(): Promise<OzonStockItem[]> {
    return fetchAllPages<OzonStockItem>(
      this.client,
      "/v4/product/info/stocks",
      { filter: { visibility: "ALL" } },
      (data) => ({
        items: data?.result?.items ?? [],
        lastId: data?.result?.last_id ?? "",
      }),
    );
  }
}
