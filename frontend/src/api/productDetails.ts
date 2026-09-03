import { apiFetch } from "./client";

export interface SalesChartPoint {
  date: string;
  orders: number;
  revenue: number;
}

export type StockStatus = "green" | "yellow" | "orange" | "red" | "unknown";

export interface StockInfo {
  current: number;
  averageSalesPerDay: number;
  estimatedDays: number | null;
  status: StockStatus;
  warning: string | null;
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
