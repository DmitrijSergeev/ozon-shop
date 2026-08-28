import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors/NotFoundError.js";

const LOW_STOCK_THRESHOLD = 5;

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

  // Продажи и выручка по товару требуют связи Order -> Product (позиции заказа).
  // В текущей схеме этой связи нет, поэтому возвращаем нули.
  // После расширения схемы (модель OrderItem) эти значения заполнятся реальными данными.
  const sales = 0;
  const revenue = 0;

  const salesChart = buildSalesChart();
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
    revenue,
    salesChart,
    stockInfo,
  };
}

function buildSalesChart(): SalesChartPoint[] {
  const points: SalesChartPoint[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    points.push({
      date: date.toISOString().slice(0, 10),
      orders: 0,
      revenue: 0,
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
