import { apiFetch } from "./client.js";

export interface OrderRow {
  id: string;
  ozonOrderId: string;
  postingNumber: string | null;
  scheme: string;
  createdAt: string;
  status: string;
  amount: number;
  products: { name: string; quantity: number }[];
}

export interface OrdersPage {
  items: OrderRow[];
  total: number;
}

export interface OrdersQuery {
  dateFrom?: string | null;
  dateTo?: string | null;
  status?: string | null;
  productId?: string | null;
}

export async function getOrders(
  shopId: string,
  query: OrdersQuery = {},
): Promise<OrdersPage> {
  const params = new URLSearchParams();
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  if (query.status) params.set("status", query.status);
  if (query.productId) params.set("productId", query.productId);

  const qs = params.toString();
  return apiFetch<OrdersPage>(`/api/orders/${shopId}${qs ? `?${qs}` : ""}`);
}

export async function getOrderStatuses(
  shopId: string,
): Promise<{ statuses: string[] }> {
  return apiFetch<{ statuses: string[] }>(`/api/orders/${shopId}/statuses`);
}
