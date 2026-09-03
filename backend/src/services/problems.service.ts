import { prisma } from "../lib/prisma.js";

export type ProblemSeverity = "critical" | "important" | "info";

export type ProblemType =
  | "out_of_stock"
  | "stock_low_3d"
  | "sales_drop_50"
  | "no_sales_14d"
  | "stock_below_week";

export interface ProblemItem {
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

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getProblems(shopId: string): Promise<ProblemsPage> {
  const products = await prisma.product.findMany({
    where: { shopId, archived: false },
    include: {
      stocks: true,
      orderItems: { select: { quantity: true, createdAt: true } },
    },
  });

  // Уже решённые проблемы (отметки "Решено")
  const resolved = await prisma.problem.findMany({
    where: { shopId, resolvedAt: { not: null } },
    select: { productId: true, type: true },
  });
  const resolvedSet = new Set(
    resolved.map((r) => `${r.productId}:${r.type}`),
  );

  const now = new Date();
  const critical: ProblemItem[] = [];
  const important: ProblemItem[] = [];
  const info: ProblemItem[] = [];

  for (const product of products) {
    const stock = product.stocks.reduce((sum, s) => sum + s.present, 0);

    // Продажи за последние 30 дней
    const since30 = new Date(now.getTime() - 30 * DAY_MS);
    const recentItems = product.orderItems.filter(
      (item) => item.createdAt >= since30,
    );
    const totalSold30 = recentItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const salesPerDay = totalSold30 / 30;

    const name = product.name ?? product.offerId;

    // --- Критические ---

    // 1. Товар закончился
    if (stock <= 0) {
      pushProblem(critical, {
        type: "out_of_stock",
        severity: "critical",
        productId: product.id,
        productName: name,
        offerId: product.offerId,
        message: "Товар закончился.",
        resolved: resolvedSet.has(`${product.id}:out_of_stock`),
      });
    }

    // 2. Товар закончится менее чем через 3 дня
    if (stock > 0 && salesPerDay > 0) {
      const estimatedDays = stock / salesPerDay;
      if (estimatedDays < 3) {
        pushProblem(critical, {
          type: "stock_low_3d",
          severity: "critical",
          productId: product.id,
          productName: name,
          offerId: product.offerId,
          message: `Товар закончится менее чем через 3 дня (≈${Math.max(
            1,
            Math.round(estimatedDays),
          )} дн.).`,
          resolved: resolvedSet.has(`${product.id}:stock_low_3d`),
        });
      }
    }

    // --- Важные ---

    // 3. Продажи упали более чем на 50%
    const drop = computeSalesDrop(product.orderItems, now);
    if (drop !== null && drop > 50) {
      pushProblem(important, {
        type: "sales_drop_50",
        severity: "important",
        productId: product.id,
        productName: name,
        offerId: product.offerId,
        message: `Продажи товара упали более чем на 50% (на ${Math.round(
          drop,
        )}%).`,
        resolved: resolvedSet.has(`${product.id}:sales_drop_50`),
      });
    }

    // 4. Товар не продаётся 14 дней
    const since14 = new Date(now.getTime() - 14 * DAY_MS);
    const sold14 = product.orderItems
      .filter((item) => item.createdAt >= since14)
      .reduce((sum, item) => sum + item.quantity, 0);
    if (sold14 === 0 && totalSold30 > 0) {
      pushProblem(important, {
        type: "no_sales_14d",
        severity: "important",
        productId: product.id,
        productName: name,
        offerId: product.offerId,
        message: "Товар не продаётся 14 дней.",
        resolved: resolvedSet.has(`${product.id}:no_sales_14d`),
      });
    }

    // --- Информационные ---

    // 5. Остаток меньше рассчитанного запаса на неделю
    if (salesPerDay > 0 && stock > 0) {
      const weekNeed = salesPerDay * 7;
      if (stock < weekNeed) {
        pushProblem(info, {
          type: "stock_below_week",
          severity: "info",
          productId: product.id,
          productName: name,
          offerId: product.offerId,
          message: `Остаток меньше рассчитанного запаса на неделю (нужно ≈${Math.ceil(
            weekNeed,
          )} шт., есть ${stock} шт.).`,
          resolved: resolvedSet.has(`${product.id}:stock_below_week`),
        });
      }
    }
  }

  const total = critical.length + important.length + info.length;

  return { critical, important, info, total };
}

export async function resolveProblem(
  shopId: string,
  productId: string,
  type: string,
): Promise<void> {
  await prisma.problem.upsert({
    where: {
      shopId_productId_type: { shopId, productId, type },
    },
    create: {
      shopId,
      productId,
      type,
      resolvedAt: new Date(),
    },
    update: {
      resolvedAt: new Date(),
    },
  });
}

function pushProblem(list: ProblemItem[], item: ProblemItem): void {
  list.push(item);
}

/**
 * Сравнивает продажи за последние 7 дней с предыдущими 7 днями.
 * Возвращает процент падения (положительное число) или null, если
 * данных недостаточно (в предыдущем периоде не было продаж).
 */
function computeSalesDrop(
  orderItems: { quantity: number; createdAt: Date }[],
  now: Date,
): number | null {
  const last7Start = new Date(now.getTime() - 7 * DAY_MS);
  const prev7Start = new Date(now.getTime() - 14 * DAY_MS);

  const last7 = orderItems
    .filter((item) => item.createdAt >= last7Start)
    .reduce((sum, item) => sum + item.quantity, 0);

  const prev7 = orderItems
    .filter(
      (item) => item.createdAt >= prev7Start && item.createdAt < last7Start,
    )
    .reduce((sum, item) => sum + item.quantity, 0);

  if (prev7 <= 0) return null;

  const drop = ((prev7 - last7) / prev7) * 100;
  return drop > 0 ? drop : null;
}
