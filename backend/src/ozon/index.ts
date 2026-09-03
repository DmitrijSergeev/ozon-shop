import type { OzonCredentials } from "./ozon.types.js";
import { createOzonClient } from "./ozonClient.js";
import { OzonProductsService } from "./ozon-products.service.js";
import { OzonOrdersService } from "./ozon-orders.service.js";
import { OzonPricesService } from "./ozon-prices.service.js";
import { OzonStocksService } from "./ozon-stocks.service.js";

/**
 * OzonModule — единая точка входа для взаимодействия с Ozon Seller API.
 *
 * Собирает все Ozon-сервисы из credentials конкретного магазина.
 * Бизнес-логика приложения работает только с этим модулем и не
 * обращается к axios/эндпоинтам Ozon напрямую.
 */
export interface OzonModule {
  products: OzonProductsService;
  orders: OzonOrdersService;
  prices: OzonPricesService;
  stocks: OzonStocksService;
}

export function createOzonModule(credentials: OzonCredentials): OzonModule {
  const client = createOzonClient(credentials);

  return {
    products: new OzonProductsService(client),
    orders: new OzonOrdersService(client),
    prices: new OzonPricesService(client),
    stocks: new OzonStocksService(client),
  };
}

export { createOzonClient } from "./ozonClient.js";
export { OzonProductsService } from "./ozon-products.service.js";
export { OzonOrdersService } from "./ozon-orders.service.js";
export { OzonPricesService } from "./ozon-prices.service.js";
export { OzonStocksService } from "./ozon-stocks.service.js";
export type { OzonOrderBatch } from "./ozon-orders.service.js";
export type { OzonPriceUpdate } from "./ozon-prices.service.js";
export type {
  OzonCredentials,
  OzonListProduct,
  OzonStockItem,
  OzonPriceItem,
  OzonOrderItem,
  OzonOrderProduct,
  OzonScheme,
} from "./ozon.types.js";
