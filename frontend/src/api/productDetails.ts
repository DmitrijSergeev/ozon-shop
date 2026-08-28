import { apiFetch } from "./client.js";

export interface SalesChartPoint {
  date: string;
  orders: number;
  revenue: number;
}

export interface StockInfo {
  current: number;
  averageSalesPerDay: number;
  estimatedDays: number | null;
}

export interface ProductDetailsData {
  id: string;
  ozonId: string;
  offerId: string;
  sku: number | null;
  name: string | null;
  image: string | null;
  price: number | null;
  oldPrice: number | null;
  currency: string;
  stock: number;
  reserved: number;
  archived: boolean;
  isDiscounted: boolean;
  sales: number;
  revenue: number;
  salesChart: SalesChartPoint[];
  stockInfo: StockInfo;
}

export async function getProductDetails(
  shopId: string,
  productId: string,
): Promise<ProductDetailsData> {
  return apiFetch<ProductDetailsData>(
    `/api/products/${shopId}/${productId}`,
  );
}
