import { prisma } from "../lib/prisma.js";

export interface AnalyticsQuery {
  /** "today" | "7d" | "30d" | "custom" */
  period: string;
  dateFrom: string | null;
  dateTo: string | null;
}

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

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function resolveRange(query: AnalyticsQuery): { from: Date; to: Date } {
  const now = new Date();
  const to = startOfDay(now);

  if (query.period === "custom" && query.dateFrom && query.dateTo) {
    const from = startOfDay(new Date(query.dateFrom));
    const toDate = startOfDay(new Date(query.dateTo));
    // включаем последний день целиком
    toDate.setDate(toDate.getDate() + 1);
    return { from, to: toDate };
  }

  let from: Date;
  if (query.period === "today") {
    from = startOfDay(now);
  } else if (query.period === "7d") {
    from = new Date(to.getTime() - 6 * DAY_MS);
  } else {
    // 30d по умолчанию
    from = new Date(to.getTime() - 29 * DAY_MS);
  }

  return { from, to: new Date(to.getTime() + DAY_MS) };
}

function buildDaySeries(from: Date, to: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(from);
  while (cursor < to) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export async function getAnalytics(
  shopId: string,
  query: AnalyticsQuery,
): Promise<AnalyticsResult> {
  const { from, to } = resolveRange(query);

  const orders = await prisma.order.findMany({
    where: { shopId, createdAt: { gte: from, lt: to } },
    select: { createdAt: true, amount: true },
  });

  const orderItems = await prisma.orderItem.findMany({
    where: { shopId, createdAt: { gte: from, lt: to } },
    include: { product: { select: { name: true, offerId: true } } },
  });

  // Серия дней для графиков
  const daySeries = buildDaySeries(from, to);

  const revenueMap = new Map<string, number>();
  const ordersMap = new Map<string, number>();
  for (const day of daySeries) {
    revenueMap.set(day, 0);
    ordersMap.set(day, 0);
  }

  for (const order of orders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    if (!revenueMap.has(day)) continue;
    revenueMap.set(day, (revenueMap.get(day) ?? 0) + Number(order.amount ?? 0));
    ordersMap.set(day, (ordersMap.get(day) ?? 0) + 1);
  }

  const revenue: DayPoint[] = daySeries.map((date) => ({
    date,
    revenue: Math.round((revenueMap.get(date) ?? 0) * 100) / 100,
    orders: ordersMap.get(date) ?? 0,
  }));

  const ordersSeries: DayPoint[] = daySeries.map((date) => ({
    date,
    revenue: Math.round((revenueMap.get(date) ?? 0) * 100) / 100,
    orders: ordersMap.get(date) ?? 0,
  }));

  // ТОП-10 товаров по продажам
  const productAgg = new Map<
    string,
    { id: string; name: string; offerId: string; sold: number; revenue: number }
  >();

  for (const item of orderItems) {
    const key = item.productId;
    const existing = productAgg.get(key);
    const revenue = Number(item.price ?? 0) * item.quantity;

    if (existing) {
      existing.sold += item.quantity;
      existing.revenue += revenue;
    } else {
      productAgg.set(key, {
        id: item.productId,
        name: item.product?.name ?? item.product?.offerId ?? "Товар",
        offerId: item.product?.offerId ?? "",
        sold: item.quantity,
        revenue,
      });
    }
  }

  const topProducts: TopProduct[] = [...productAgg.values()]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      name: p.name,
      offerId: p.offerId,
      sold: p.sold,
      revenue: Math.round(p.revenue * 100) / 100,
    }));

  // Товары без продаж за период
  const soldProductIds = new Set(productAgg.keys());
  const allProducts = await prisma.product.findMany({
    where: { shopId, archived: false },
    select: { id: true },
  });

  const noSalesCount = allProducts.filter(
    (p) => !soldProductIds.has(p.id),
  ).length;

  const days = Math.round((to.getTime() - from.getTime()) / DAY_MS);

  return {
    period: {
      from: from.toISOString(),
      to: to.toISOString(),
      days,
    },
    revenue,
    orders: ordersSeries,
    topProducts,
    noSales: {
      count: noSalesCount,
      days,
    },
  };
}
