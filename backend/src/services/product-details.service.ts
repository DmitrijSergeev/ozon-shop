import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors/NotFoundError.js";

export interface ProductDetails {
  id: string;
  ozonId: string;
  offerId: string;
  sku: number | null;
  name: string | null;
  image: string | null;
  price: number | null;
  oldPrice: number | null;
  currency: string;
  stock: number;
  reserved: number;
  archived: boolean;
  isDiscounted: boolean;
  sales: number;
  revenue: number;
  salesChart: SalesChartPoint[];
  stockInfo: StockInfo;
}

export interface SalesChartPoint {
  date: string;
  orders: number;
  revenue: number;
}

export interface StockInfo {
  current: number;
  averageSalesPerDay: number;
  estimatedDays: number | null;
}

export async function getProductDetails(
  shopId: string,
  productId: string,
): Promise<ProductDetails> {
  const product = await prisma.product.findFirst({
    where: { id: productId, shopId },
    include: {
      prices: { orderBy: { updatedAt: "desc" }, take: 1 },
      stocks: true,
    },
  });

  if (!product) {
    throw new NotFoundError("Товар не найден");
  }

  const price = product.prices[0]?.price ?? null;
  const oldPrice = product.prices[0]?.oldPrice ?? null;
  const currency = product.prices[0]?.currency ?? "RUB";

  const stock = product.stocks.reduce((sum, s) => sum + s.present, 0);
  const reserved = product.stocks.reduce((sum, s) => sum + s.reserved, 0);

  // Продажи и выручка по товару из позиций заказов (OrderItem)
  const orderItems = await prisma.orderItem.findMany({
    where: { productId: product.id },
    select: { quantity: true, price: true, createdAt: true },
  });

  const sales = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const revenue = orderItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  const salesChart = buildSalesChart(orderItems);
  const stockInfo = buildStockInfo(stock, salesChart);

  return {
    id: product.id,
    ozonId: product.ozonId,
    offerId: product.offerId,
    sku: product.sku,
    name: product.name,
    image: null,
    price: price !== null ? Number(price) : null,
    oldPrice: oldPrice !== null ? Number(oldPrice) : null,
    currency,
    stock,
    reserved,
    archived: product.archived,
    isDiscounted: product.isDiscounted,
    sales,
    revenue: Number(revenue.toFixed(2)),
    salesChart,
    stockInfo,
  };
}

function buildSalesChart(
  orderItems: { quantity: number; price: number; createdAt: Date }[],
): SalesChartPoint[] {
  const points: SalesChartPoint[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Инициализируем 30 дней
  const byDate = new Map<string, { orders: number; revenue: number }>();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    byDate.set(key, { orders: 0, revenue: 0 });
  }

  // Заполняем данными из позиций заказов
  for (const item of orderItems) {
    const key = item.createdAt.toISOString().slice(0, 10);
    const bucket = byDate.get(key);
    if (!bucket) continue;

    bucket.orders += item.quantity;
    bucket.revenue += Number(item.price) * item.quantity;
  }

  for (const [date, data] of byDate) {
    points.push({
      date,
      orders: data.orders,
      revenue: Number(data.revenue.toFixed(2)),
    });
  }

  return points;
}

function buildStockInfo(
  current: number,
  chart: SalesChartPoint[],
): StockInfo {
  const totalOrders = chart.reduce((sum, p) => sum + p.orders, 0);
  const averageSalesPerDay = totalOrders / 30;

  const estimatedDays =
    averageSalesPerDay > 0 ? Math.round(current / averageSalesPerDay) : null;

  return {
    current,
    averageSalesPerDay: Number(averageSalesPerDay.toFixed(1)),
    estimatedDays,
  };
}
