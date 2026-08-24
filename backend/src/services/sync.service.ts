import { prisma } from "../lib/prisma.js";
import { getOzonCredentials } from "./shop.service.js";
import {
  createOzonClient,
  type OzonListProduct,
  type OzonStockItem,
  type OzonPriceItem,
  type OzonOrderItem,
} from "./ozonClient.js";

const PAGE_LIMIT = 1000;
const MAX_PAGES = 100;

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

export async function syncShop(shopId: string) {
  const credentials = await getOzonCredentials(shopId);
  const client = createOzonClient(credentials);

  const syncRun = await prisma.syncRun.create({
    data: { shopId, status: "running" },
  });

  try {
    // 1. Товары
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

    // 2. Остатки
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

    // 3. Цены
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

    // 4. Заказы (последние)
    const orders = await fetchRecentOrders(client);
    await upsertOrders(shopId, orders);

    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: { status: "success", finishedAt: new Date() },
    });

    await prisma.ozonConnection.update({
      where: { shopId },
      data: { status: "connected", lastChecked: new Date() },
    });

    return { status: "success" };
  } catch (err: any) {
    await prisma.syncRun.update({
      where: { id: syncRun.id },
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

async function fetchRecentOrders(client: ReturnType<typeof createOzonClient>): Promise<OzonOrderItem[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const response = await client.post("/v3/posting/fbs/list", {
      filter: { since, status: "" },
      limit: 100,
    });

    return response.data?.result ?? [];
  } catch {
    return [];
  }
}

async function upsertOrders(shopId: string, orders: OzonOrderItem[]) {
  for (const o of orders) {
    await prisma.order.upsert({
      where: { shopId_ozonOrderId: { shopId, ozonOrderId: String(o.order_id) } },
      create: {
        shopId,
        ozonOrderId: String(o.order_id),
        status: o.status,
        amount: Number(o.total_price) || 0,
      },
      update: {
        status: o.status,
        amount: Number(o.total_price) || 0,
      },
    });
  }
}
