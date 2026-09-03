import { apiFetch } from "./client.js";

export type AnalyticsPeriod = "today" | "7d" | "30d" | "custom";

export interface DayPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  offerId: string;
  sold: number;
  revenue: number;
}

export interface AnalyticsResult {
  period: {
    from: string;
    to: string;
    days: number;
  };
  revenue: DayPoint[];
  orders: DayPoint[];
  topProducts: TopProduct[];
  noSales: {
    count: number;
    days: number;
  };
}

export interface AnalyticsQuery {
  period: AnalyticsPeriod;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export async function getAnalytics(
  shopId: string,
  query: AnalyticsQuery,
): Promise<AnalyticsResult> {
  const params = new URLSearchParams();
  params.set("period", query.period);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);

  return apiFetch<AnalyticsResult>(
    `/api/analytics/${shopId}?${params.toString()}`,
  );
}
