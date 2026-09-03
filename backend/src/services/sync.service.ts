import { prisma } from "../lib/prisma.js";
import { getOzonCredentials } from "./shop.service.js";
import {
  createOzonClient,
  type OzonListProduct,
  type OzonStockItem,
  type OzonPriceItem,
  type OzonOrderItem,
  type OzonScheme,
} from "./ozonClient.js";

const PAGE_LIMIT = 1000;
const MAX_PAGES = 100;

export type SyncType = "frequent" | "infrequent" | "full";

async function fetchAllPages<T>(
  client: ReturnType<typeof createOzonClient>,
  url: string,
  body: Record<string, unknown>,
  extract: (data: any) => { items: T[]; lastId: string },
): Promise<T[]> {
  const collected: T[] = [];
  let lastId = "";

  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await client.post(url, { ...body, last_id: lastId, limit: PAGE_LIMIT });
    const { items, lastId: nextLastId } = extract(response.data);

    collected.push(...items);

    if (!nextLastId) break;
    lastId = nextLastId;
  }

  return collected;
}

/**
 * Синхронизация магазина.
 *
 * @param type frequent — заказы + остатки (каждые 10-15 минут);
 *             infrequent — товары + цены (каждый час);
 *             full — всё сразу (кнопка «Обновить сейчас»).
 */
export async function syncShop(shopId: string, type: SyncType = "full") {
  const credentials = await getOzonCredentials(shopId);
  const client = createOzonClient(credentials);

  const syncJob = await prisma.syncJob.create({
    data: { shopId, type, status: "running" },
  });

  try {
    if (type === "frequent" || type === "full") {
      // Частые данные: остатки + заказы
      const stocks = await fetchAllPages<OzonStockItem>(
        client,
        "/v4/product/info/stocks",
        { filter: { visibility: "ALL" } },
        (data) => ({
          items: data?.result?.items ?? [],
          lastId: data?.result?.last_id ?? "",
        }),
      );
      await upsertStocks(shopId, stocks);

      const orderBatches = await fetchRecentOrders(client);
      await upsertOrders(shopId, orderBatches);
    }

    if (type === "infrequent" || type === "full") {
      // Менее частые данные: товары + цены
      const products = await fetchAllPages<OzonListProduct>(
        client,
        "/v3/product/list",
        { filter: { visibility: "ALL" } },
        (data) => ({
          items: data?.result?.items ?? [],
          lastId: data?.result?.last_id ?? "",
        }),
      );
      await upsertProducts(shopId, products);

      const prices = await fetchAllPages<OzonPriceItem>(
        client,
        "/v5/product/info/prices",
        { filter: { visibility: "ALL" } },
        (data) => ({
          items: data?.result?.items ?? [],
          lastId: data?.result?.last_id ?? "",
        }),
      );
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

    for (const stock of s.stocks) {
      const source = stock.type === "fbo" ? "fbo" : "fbs";

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
  }
}

async function fetchRecentOrders(
  client: ReturnType<typeof createOzonClient>,
): Promise<{ orders: OzonOrderItem[]; scheme: OzonScheme }[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const results: { orders: OzonOrderItem[]; scheme: OzonScheme }[] = [];

  // FBS-заказы
  try {
    const fbs = await client.post("/v3/posting/fbs/list", {
      filter: { since, status: "" },
      limit: 100,
      with: { analytics_data: false, barcodes: false, financial_data: false },
    });
    results.push({ orders: fbs.data?.result ?? [], scheme: "fbs" });
  } catch {
    // FBS может быть недоступен — пропускаем
  }

  // FBO-заказы
  try {
    const fbo = await client.post("/v2/posting/fbo/list", {
      filter: { since, status: "" },
      limit: 100,
      with: { analytics_data: false, barcodes: false, financial_data: false },
    });
    results.push({ orders: fbo.data?.result ?? [], scheme: "fbo" });
  } catch {
    // FBO может быть недоступен — пропускаем
  }

  return results;
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
