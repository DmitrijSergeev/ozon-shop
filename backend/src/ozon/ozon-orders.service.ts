import type { AxiosInstance } from "axios";
import type { OzonOrderItem, OzonScheme } from "./ozon.types.js";

export interface OzonOrderBatch {
  orders: OzonOrderItem[];
  scheme: OzonScheme;
}

/**
 * Взаимодействие с заказами Ozon.
 *
 * Инкапсулирует эндпоинты FBS (`/v3/posting/fbs/list`) и FBO
 * (`/v2/posting/fbo/list`). Учитывает схему работы магазина.
 */
export class OzonOrdersService {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Получение недавних заказов по обеим схемам (FBS + FBO).
   *
   * Каждая схема обрабатывается независимо: если одна недоступна,
   * вторая всё равно возвращается.
   */
  async listRecent(days = 30): Promise<OzonOrderBatch[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const results: OzonOrderBatch[] = [];

    // FBS-заказы
    try {
      const fbs = await this.client.post("/v3/posting/fbs/list", {
        filter: { since, status: "" },
        limit: 100,
        with: { analytics_data: false, barcodes: false, financial_data: false },
      });
      results.push({ orders: fbs.data?.result ?? [], scheme: "fbs" });
    } catch {
      // FBS может быть недоступен — пропускаем
    }

    // FBO-заказы
    try {
      const fbo = await this.client.post("/v2/posting/fbo/list", {
        filter: { since, status: "" },
        limit: 100,
        with: { analytics_data: false, barcodes: false, financial_data: false },
      });
      results.push({ orders: fbo.data?.result ?? [], scheme: "fbo" });
    } catch {
      // FBO может быть недоступен — пропускаем
    }

    return results;
  }
}
