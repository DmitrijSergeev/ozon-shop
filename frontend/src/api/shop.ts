import { apiFetch } from "./client.js";

export interface Shop {
  id: string;
  name: string;
  connections: { status: string; lastChecked: string | null }[];
}

export interface DashboardMetrics {
  todayRevenue: number;
  weekRevenue: number;
  todayOrderCount: number;
  averageCheck: number;
  productCount: number;
  outOfStockCount: number;
  lowStockCount: number;
}

export interface AttentionItem {
  id: string;
  severity: "red" | "orange" | "yellow" | "blue" | "purple";
  label: string;
  count: number;
}

export async function listShops(): Promise<Shop[]> {
  return apiFetch<Shop[]>("/api/shops");
}

export async function createShop(name: string): Promise<Shop> {
  return apiFetch<Shop>("/api/shops", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function connectOzon(shopId: string, clientId: string, apiKey: string): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/api/shops/${shopId}/connect-ozon`, {
    method: "POST",
    body: JSON.stringify({ clientId, apiKey }),
  });
}

export async function syncShop(shopId: string): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/api/sync/${shopId}/sync`, {
    method: "POST",
  });
}

export async function getDashboard(shopId: string): Promise<{ metrics: DashboardMetrics }> {
  return apiFetch<{ metrics: DashboardMetrics }>(`/api/dashboard/${shopId}/dashboard`);
}

export async function getAttention(shopId: string): Promise<{ items: AttentionItem[] }> {
  return apiFetch<{ items: AttentionItem[] }>(`/api/dashboard/${shopId}/attention`);
}
