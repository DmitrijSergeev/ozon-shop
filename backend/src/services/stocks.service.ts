import { prisma } from "../lib/prisma.js";

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

export interface StocksQuery {
  /** Фильтр: показать товары, которые закончатся в течение N дней */
  withinDays: number | null;
}

export async function getStocks(
  shopId: string,
  query: StocksQuery,
): Promise<StocksPage> {
  const products = await prisma.product.findMany({
    where: { shopId, archived: false },
    include: {
      stocks: true,
      orderItems: { select: { quantity: true, createdAt: true } },
    },
    orderBy: { name: "asc" },
  });

  const rows: StockRow[] = products.map((product) => {
    const stock = product.stocks.reduce((sum, s) => sum + s.present, 0);

    // Продажи за последние 30 дней
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const recentItems = product.orderItems.filter(
      (item) => item.createdAt >= since,
    );
    const totalSold = recentItems.reduce((sum, item) => sum + item.quantity, 0);
    const salesPerDay = totalSold / 30;

    const estimatedDays =
      salesPerDay > 0 ? Math.round(stock / salesPerDay) : null;

    const status = analyzeStockStatus(stock, salesPerDay, estimatedDays);

    return {
      id: product.id,
      ozonId: product.ozonId,
      offerId: product.offerId,
      name: product.name,
      stock,
      salesPerDay: Number(salesPerDay.toFixed(1)),
      estimatedDays,
      status,
    };
  });

  // Фильтр по сроку окончания
  const filtered = rows.filter((row) => {
    if (query.withinDays === null) return true;

    // Товары без остатка или с неизвестным прогнозом — показываем при любом фильтре,
    // если остаток 0 (закончился уже сейчас)
    if (row.stock <= 0) return true;

    if (row.estimatedDays === null) return false;

    return row.estimatedDays <= query.withinDays;
  });

  return { items: filtered, total: filtered.length };
}

function analyzeStockStatus(
  stock: number,
  salesPerDay: number,
  estimatedDays: number | null,
): StockStatus {
  if (stock <= 0) return "red";

  if (salesPerDay <= 0 || estimatedDays === null) return "unknown";

  if (estimatedDays < 3) return "red";
  if (estimatedDays < 7) return "orange";
  if (estimatedDays < 14) return "yellow";
  return "green";
}
