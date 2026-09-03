import { apiFetch } from "./client";

export interface PriceRow {
  id: string;
  ozonId: string;
  offerId: string;
  name: string | null;
  price: number | null;
  oldPrice: number | null;
  minPrice: number | null;
  currency: string;
}

export interface PricesPage {
  items: PriceRow[];
  total: number;
}

export interface PriceUpdateResult {
  updated: number;
  failed: number;
  errors: { productId: string; message: string }[];
}

export async function getPrices(shopId: string): Promise<PricesPage> {
  return apiFetch<PricesPage>(`/api/prices/${shopId}`);
}

export async function updatePrices(
  shopId: string,
  updates: { productId: string; price: number }[],
): Promise<PriceUpdateResult> {
  return apiFetch<PriceUpdateResult>(`/api/prices/${shopId}/update`, {
    method: "POST",
    body: JSON.stringify({ updates }),
  });
}
