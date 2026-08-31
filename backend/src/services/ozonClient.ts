import axios, { AxiosInstance } from "axios";

export interface OzonCredentials {
  clientId: string;
  apiKey: string;
}

export function createOzonClient(credentials: OzonCredentials): AxiosInstance {
  return axios.create({
    baseURL: "https://api-seller.ozon.ru",
    headers: {
      "Client-Id": credentials.clientId,
      "Api-Key": credentials.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
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

export interface OzonListResponse {
  result: {
    items: OzonListProduct[];
    total: number;
    last_id: string;
  };
}

export interface OzonStockItem {
  product_id: number;
  offer_id: string;
  stocks: { type: string; present: number; reserved: number }[];
}

export interface OzonStockResponse {
  result: {
    items: OzonStockItem[];
    total: number;
    last_id: string;
  };
}

export interface OzonPriceItem {
  product_id: number;
  offer_id: string;
  price: { price: string; old_price: string; min_price: string; currency_code: string };
}

export interface OzonPriceResponse {
  result: {
    items: OzonPriceItem[];
    total: number;
    last_id: string;
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

export interface OzonOrderResponse {
  result: OzonOrderItem[];
}
