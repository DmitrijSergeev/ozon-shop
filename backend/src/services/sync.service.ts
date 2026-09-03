import { prisma } from "../lib/prisma.js";
import { getOzonCredentials } from "./shop.service.js";
import { createOzonModule } from "../ozon/index.js";
import type {
  OzonListProduct,
  OzonStockItem,
  OzonPriceItem,
  OzonOrderItem,
  OzonScheme,
} from "../ozon/index.js";

export type SyncType = "frequent" | "infrequent" | "full";

/**
 * Синхронизация магазина.
 *
 * @param type frequent — заказы + остатки (каждые 10-15 минут);
 *             infrequent — товары + цены (каждый час);
 *             full — всё сразу (кнопка «Обновить сейчас»).
 */
export async function syncShop(shopId: string, type: SyncType = "full") {
  const credentials = await getOzonCredentials(shopId);
  const ozon = createOzonModule(credentials);

  const syncJob = await prisma.syncJob.create({
    data: { shopId, type, status: "running" },
  });

  try {
    if (type === "frequent" || type === "full") {
      // Частые данные: остатки + заказы
      const stocks = await ozon.stocks.listAll();
      await upsertStocks(shopId, stocks);

      const orderBatches = await ozon.orders.listRecent(30);
      await upsertOrders(shopId, orderBatches);
    }

    if (type === "infrequent" || type === "full") {
      // Менее частые данные: товары + цены
      const products = await ozon.products.listAll();
      await upsertProducts(shopId, products);

      const prices = await ozon.prices.listAll();
      await upsertPrices(shopId, prices);
    }

    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: { status: "success", finishedAt: new Date() },
    });

    await prisma.ozonConnection.update({
      where: { shopId },
      data: { status: "connected", lastChecked: new Date() },
    });

    return { status: "success", type };
  } catch (err: any) {
    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: { status: "failed", error: String(err?.message ?? err), finishedAt: new Date() },
    });

    const code = err?.response?.status;
    const status = code === 401 || code === 403 ? "auth_error" : "api_unavailable";

    await prisma.ozonConnection.update({
      where: { shopId },
      data: { status, lastChecked: new Date() },
    });

    throw err;
  }
}

/**
 * Последняя успешная синхронизация магазина.
 */
export async function getLastSync(shopId: string) {
  const last = await prisma.syncJob.findFirst({
    where: { shopId, status: "success" },
    orderBy: { finishedAt: "desc" },
    select: { type: true, finishedAt: true },
  });

  return last
    ? { type: last.type, finishedAt: last.finishedAt.toISOString() }
    : null;
}

async function upsertProducts(shopId: string, products: OzonListProduct[]) {
  for (const p of products) {
    await prisma.product.upsert({
      where: { shopId_ozonId: { shopId, ozonId: String(p.product_id) } },
      create: {
        shopId,
        ozonId: String(p.product_id),
        offerId: p.offer_id,
        sku: p.sku ?? null,
        archived: p.archived,
        isDiscounted: p.is_discounted,
        hasFbo: p.has_fbo_stocks,
        hasFbs: p.has_fbs_stocks,
      },
      update: {
        offerId: p.offer_id,
        sku: p.sku ?? null,
        archived: p.archived,
        isDiscounted: p.is_discounted,
        hasFbo: p.has_fbo_stocks,
        hasFbs: p.has_fbs_stocks,
      },
    });
  }
}

async function upsertStocks(shopId: string, stocks: OzonStockItem[]) {
  for (const s of stocks) {
    const product = await prisma.product.findUnique({
      where: { shopId_ozonId: { shopId, ozonId: String(s.product_id) } },
    });

    if (!product) continue;

    // Суммарный остаток по всем складам (fbo + fbs)
    let totalPresent = 0;

    for (const stock of s.stocks) {
      const source = stock.type === "fbo" ? "fbo" : "fbs";
      totalPresent += stock.present;

      await prisma.stock.upsert({
        where: { productId_source: { productId: product.id, source } },
        create: {
          shopId,
          productId: product.id,
          source,
          present: stock.present,
          reserved: stock.reserved,
        },
        update: {
          present: stock.present,
          reserved: stock.reserved,
        },
      });
    }

    // Снапшот остатка в историю
    await prisma.productStockHistory.create({
      data: {
        shopId,
        productId: product.id,
        stock: totalPresent,
      },
    });
  }
}

async function upsertPrices(shopId: string, prices: OzonPriceItem[]) {
  for (const p of prices) {
    const product = await prisma.product.findUnique({
      where: { shopId_ozonId: { shopId, ozonId: String(p.product_id) } },
    });

    if (!product) continue;

    const price = Number(p.price.price);
    const oldPrice = p.price.old_price ? Number(p.price.old_price) : null;
    const minPrice = p.price.min_price ? Number(p.price.min_price) : null;

    await prisma.price.upsert({
      where: { productId: product.id },
      create: {
        shopId,
        productId: product.id,
        price,
        oldPrice,
        minPrice,
        currency: p.price.currency_code || "RUB",
      },
      update: {
        price,
        oldPrice,
        minPrice,
        currency: p.price.currency_code || "RUB",
      },
    });

    // Снапшот цены в историю
    await prisma.productPriceHistory.create({
      data: {
        shopId,
        productId: product.id,
        price,
        oldPrice,
      },
    });
  }
}

async function upsertOrders(
  shopId: string,
  batches: { orders: OzonOrderItem[]; scheme: OzonScheme }[],
) {
  for (const batch of batches) {
    for (const o of batch.orders) {
      const order = await prisma.order.upsert({
        where: { shopId_ozonOrderId: { shopId, ozonOrderId: String(o.order_id) } },
        create: {
          shopId,
          ozonOrderId: String(o.order_id),
          postingNumber: o.posting_number ?? null,
          scheme: batch.scheme,
          status: o.status,
          amount: Number(o.total_price) || 0,
        },
        update: {
          postingNumber: o.posting_number ?? null,
          scheme: batch.scheme,
          status: o.status,
          amount: Number(o.total_price) || 0,
        },
      });

      await upsertOrderItems(shopId, order.id, o);
    }
  }
}

async function upsertOrderItems(
  shopId: string,
  orderId: string,
  order: OzonOrderItem,
) {
  if (!order.products || order.products.length === 0) return;

  for (const item of order.products) {
    // Привязываем позицию к товару по SKU (числовой) или offer_id
    const product = await prisma.product.findFirst({
      where: {
        shopId,
        OR: [
          { sku: item.sku ?? undefined },
          { offerId: item.offer_id },
        ],
      },
    });

    if (!product) continue;

    await prisma.orderItem.create({
      data: {
        shopId,
        orderId,
        productId: product.id,
        sku: item.sku ?? null,
        quantity: item.quantity,
        price: Number(item.price) || 0,
      },
    });
  }
}
