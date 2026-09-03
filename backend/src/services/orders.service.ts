import { prisma } from "../lib/prisma.js";

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
  dateFrom: string | null;
  dateTo: string | null;
  status: string | null;
  productId: string | null;
}

export async function getOrders(
  shopId: string,
  query: OrdersQuery,
): Promise<OrdersPage> {
  const where: Record<string, unknown> = { shopId };

  if (query.dateFrom || query.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (query.dateFrom) createdAt.gte = new Date(query.dateFrom);
    if (query.dateTo) createdAt.lte = new Date(query.dateTo);
    where.createdAt = createdAt;
  }

  if (query.status) {
    where.status = query.status;
  }

  // Фильтр по товару: заказы, содержащие указанный товар
  if (query.productId) {
    where.orderItems = { some: { productId: query.productId } };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      orderItems: {
        include: {
          product: { select: { name: true, offerId: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const items: OrderRow[] = orders.map((order) => ({
    id: order.id,
    ozonOrderId: order.ozonOrderId,
    postingNumber: order.postingNumber,
    scheme: order.scheme,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    amount: Number(order.amount),
    products: order.orderItems.map((item) => ({
      name: item.product?.name ?? item.product?.offerId ?? "Товар",
      quantity: item.quantity,
    })),
  }));

  return { items, total: items.length };
}

export async function getOrderStatuses(shopId: string): Promise<string[]> {
  const statuses = await prisma.order.findMany({
    where: { shopId },
    select: { status: true },
    distinct: ["status"],
  });

  return statuses.map((s) => s.status).filter(Boolean);
}
