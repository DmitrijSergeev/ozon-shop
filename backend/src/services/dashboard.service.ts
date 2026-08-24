import { prisma } from "../lib/prisma.js";

const LOW_STOCK_THRESHOLD = 5;

export async function getDashboard(shopId: string) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    productCount,
    outOfStockCount,
    lowStockCount,
    todayOrders,
    weekOrders,
  ] = await Promise.all([
    prisma.product.count({ where: { shopId, archived: false } }),
    prisma.product.count({
      where: {
        shopId,
        archived: false,
        stocks: { some: { present: 0 } },
      },
    }),
    prisma.product.count({
      where: {
        shopId,
        archived: false,
        stocks: { some: { present: { gt: 0, lte: LOW_STOCK_THRESHOLD } } },
      },
    }),
    prisma.order.findMany({
      where: { shopId, createdAt: { gte: todayStart } },
      select: { amount: true },
    }),
    prisma.order.findMany({
      where: { shopId, createdAt: { gte: weekStart } },
      select: { amount: true },
    }),
  ]);

  const todayRevenue = sum(todayOrders);
  const weekRevenue = sum(weekOrders);
  const todayOrderCount = todayOrders.length;
  const averageCheck = todayOrderCount > 0 ? todayRevenue / todayOrderCount : 0;

  return {
    metrics: {
      todayRevenue,
      weekRevenue,
      todayOrderCount,
      averageCheck,
      productCount,
      outOfStockCount,
      lowStockCount,
    },
  };
}

export async function getAttention(shopId: string) {
  const outOfStock = await prisma.product.count({
    where: { shopId, archived: false, stocks: { some: { present: 0 } } },
  });

  const lowStock = await prisma.product.count({
    where: {
      shopId,
      archived: false,
      stocks: { some: { present: { gt: 0, lte: LOW_STOCK_THRESHOLD } } },
    },
  });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const newOrders = await prisma.order.count({
    where: { shopId, createdAt: { gte: todayStart } },
  });

  const suspiciousPrices = await prisma.price.count({
    where: {
      shopId,
      minPrice: { not: null },
      price: { lt: prisma.price.fields.minPrice },
    },
  });

  const items: { id: string; severity: "red" | "orange" | "yellow" | "blue" | "purple"; label: string; count: number }[] = [];

  if (outOfStock > 0) {
    items.push({ id: "out-of-stock", severity: "red", label: "товаров закончились", count: outOfStock });
  }
  if (lowStock > 0) {
    items.push({ id: "low-stock", severity: "orange", label: "товаров скоро закончатся", count: lowStock });
  }
  if (newOrders > 0) {
    items.push({ id: "new-orders", severity: "blue", label: "новых заказов", count: newOrders });
  }
  if (suspiciousPrices > 0) {
    items.push({ id: "suspicious-prices", severity: "purple", label: "товаров с подозрительно низкой ценой", count: suspiciousPrices });
  }

  return { items };
}

function sum(orders: { amount: unknown }[]): number {
  return orders.reduce((total, o) => total + Number(o.amount ?? 0), 0);
}
