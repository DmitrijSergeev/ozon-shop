import type { AxiosInstance } from "axios";
import type { OzonPriceItem } from "./ozon.types.js";
import { fetchAllPages } from "./ozon-products.service.js";

const IMPORT_BATCH_SIZE = 1000;

export interface OzonPriceUpdate {
  offerId: string;
  productId: number;
  price: number;
}

/**
 * Взаимодействие с ценами Ozon.
 *
 * Инкапсулирует эндпоинты `/v5/product/info/prices` (чтение) и
 * `/v1/product/import/prices` (обновление).
 */
export class OzonPricesService {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Получение цен по всем товарам магазина.
   */
  async listAll(): Promise<OzonPriceItem[]> {
    return fetchAllPages<OzonPriceItem>(
      this.client,
      "/v5/product/info/prices",
      { filter: { visibility: "ALL" } },
      (data) => ({
        items: data?.result?.items ?? [],
        lastId: data?.result?.last_id ?? "",
      }),
    );
  }

  /**
   * Обновление цен через `/v1/product/import/prices`.
   *
   * Отправляет батчами до 1000 товаров. Возвращает список task_id
   * созданных задач импорта.
   */
  async updatePrices(updates: OzonPriceUpdate[]): Promise<string[]> {
    const taskIds: string[] = [];

    for (let i = 0; i < updates.length; i += IMPORT_BATCH_SIZE) {
      const batch = updates.slice(i, i + IMPORT_BATCH_SIZE);

      const prices = batch.map((u) => ({
        auto_action_enabled: "UNKNOWN",
        currency_code: "RUB",
        offer_id: u.offerId,
        old_price: "0",
        price: String(u.price),
        product_id: u.productId,
        min_price: "0",
      }));

      const response = await this.client.post("/v1/product/import/prices", {
        prices,
      });

      const taskId = response.data?.result?.task_id;
      if (taskId) taskIds.push(String(taskId));
    }

    return taskIds;
  }
}
