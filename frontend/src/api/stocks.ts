import { apiFetch } from "./client";

export type StockStatus = "green" | "yellow" | "orange" | "red" | "unknown";

export interface StockRow {
  id: string;
  ozonId: string;
  offerId: string;
  name: string | null;
  stock: number;
  salesPerDay: number;
  estimatedDays: number | null;
  status: StockStatus;
}

export interface StocksPage {
  items: StockRow[];
  total: number;
}

export async function getStocks(
  shopId: string,
  withinDays?: number | null,
): Promise<StocksPage> {
  const params = new URLSearchParams();
  if (withinDays) {
    params.set("withinDays", String(withinDays));
  }

  const query = params.toString();
  return apiFetch<StocksPage>(`/api/stocks/${shopId}${query ? `?${query}` : ""}`);
}
