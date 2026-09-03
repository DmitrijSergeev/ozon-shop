/**
 * Типы, описывающие структуру ответов Ozon Seller API.
 *
 * Эти типы живут только внутри OzonModule и не должны протекать
 * в бизнес-логику приложения — бизнес-слой работает с собственными
 * доменными типами, а Ozon-сервисы маппят API-ответы в них.
 */

export interface OzonCredentials {
  clientId: string;
  apiKey: string;
}

export interface OzonListProduct {
  product_id: number;
  offer_id: string;
  has_fbo_stocks: boolean;
  has_fbs_stocks: boolean;
  archived: boolean;
  is_discounted: boolean;
  sku?: number;
}

export interface OzonStockItem {
  product_id: number;
  offer_id: string;
  stocks: { type: string; present: number; reserved: number }[];
}

export interface OzonPriceItem {
  product_id: number;
  offer_id: string;
  price: {
    price: string;
    old_price: string;
    min_price: string;
    currency_code: string;
  };
}

export interface OzonOrderItem {
  order_id: number;
  posting_number?: string;
  status: string;
  total_price: string;
  created_at: string;
  in_process_at?: string;
  products?: OzonOrderProduct[];
}

export interface OzonOrderProduct {
  sku: number;
  name: string;
  quantity: number;
  offer_id: string;
  price: string;
}

/** Схема работы магазина */
export type OzonScheme = "fbs" | "fbo";

/** Универсальная обёртка ответа с курсорной пагинацией */
export interface OzonPagedResult<T> {
  items: T[];
  lastId: string;
}
