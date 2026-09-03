import { apiFetch } from "./client.js";

export type ProblemSeverity = "critical" | "important" | "info";

export type ProblemType =
  | "out_of_stock"
  | "stock_low_3d"
  | "sales_drop_50"
  | "no_sales_14d"
  | "stock_below_week";

export interface ProblemItem {
  id: string;
  type: ProblemType;
  severity: ProblemSeverity;
  productId: string;
  productName: string;
  offerId: string;
  message: string;
  resolved: boolean;
}

export interface ProblemsPage {
  critical: ProblemItem[];
  important: ProblemItem[];
  info: ProblemItem[];
  total: number;
}

export async function getProblems(shopId: string): Promise<ProblemsPage> {
  return apiFetch<ProblemsPage>(`/api/problems/${shopId}`);
}

export async function resolveProblem(
  shopId: string,
  productId: string,
  type: string,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/problems/${shopId}/resolve`, {
    method: "POST",
    body: JSON.stringify({ productId, type }),
  });
}
