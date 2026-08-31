import { prisma } from "../lib/prisma.js";
import { getOzonCredentials } from "./shop.service.js";
import { createOzonClient } from "./ozonClient.js";

export interface PriceRow {
  id: string;
  ozonId: string;
  offerId: string;
  name: string | null;
  price: number | null;
  oldPrice: number | null;
  minPrice: number | null;
  currency: string;
}

export interface PricesPage {
  items: PriceRow[];
  total: number;
}

export interface PriceUpdateItem {
  productId: string;
  price: number;
}

export interface PriceUpdateResult {
  updated: number;
  failed: number;
  errors: { productId: string; message: string }[];
}

export async function getPrices(shopId: string): Promise<PricesPage> {
  const products = await prisma.product.findMany({
    where: { shopId },
    include: {
      prices: { orderBy: { updatedAt: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  const items: PriceRow[] = products.map((product) => {
    const price = product.prices[0]?.price ?? null;
    const oldPrice = product.prices[0]?.oldPrice ?? null;
    const minPrice = product.prices[0]?.minPrice ?? null;
    const currency = product.prices[0]?.currency ?? "RUB";

    return {
      id: product.id,
      ozonId: product.ozonId,
      offerId: product.offerId,
      name: product.name,
      price: price !== null ? Number(price) : null,
      oldPrice: oldPrice !== null ? Number(oldPrice) : null,
      minPrice: minPrice !== null ? Number(minPrice) : null,
      currency,
    };
  });

  return { items, total: items.length };
}

export async function updatePrices(
  shopId: string,
  updates: PriceUpdateItem[],
): Promise<PriceUpdateResult> {
  const credentials = await getOzonCredentials(shopId);
  const client = createOzonClient(credentials);

  const result: PriceUpdateResult = { updated: 0, failed: 0, errors: [] };

  // Получаем товары по id, чтобы знать их ozonId (product_id) для Ozon API
  const products = await prisma.product.findMany({
    where: { shopId, id: { in: updates.map((u) => u.productId) } },
    select: { id: true, ozonId: true, offerId: true },
  });

  const productById = new Map(products.map((p) => [p.id, p]));

  // Ozon API принимает батчами до 1000 товаров
  const BATCH_SIZE = 1000;
  const batches: PriceUpdateItem[][] = [];

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    batches.push(updates.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    const prices = batch
      .map((u) => {
        const product = productById.get(u.productId);
        if (!product) return null;

        return {
          auto_action_enabled: "UNKNOWN",
          currency_code: "RUB",
          offer_id: product.offerId,
          old_price: "0",
          price: String(u.price),
          product_id: Number(product.ozonId),
          min_price: "0",
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    if (prices.length === 0) continue;

    try {
      const response = await client.post("/v1/product/import/prices", {
        prices,
      });

      const taskId = response.data?.result?.task_id;

      if (taskId) {
        // Успешно отправлено в Ozon
        result.updated += prices.length;

        // Обновляем локальную цену в БД
        for (const p of prices) {
          const product = products.find((prod) => prod.offerId === p.offer_id);
          if (!product) continue;

          await prisma.price.upsert({
            where: { productId: product.id },
            create: {
              shopId,
              productId: product.id,
              price: Number(p.price),
              currency: "RUB",
            },
            update: {
              price: Number(p.price),
              currency: "RUB",
            },
          });
        }
      } else {
        result.failed += prices.length;
        for (const p of prices) {
          result.errors.push({
            productId: p.offer_id,
            message: "Ozon не вернул task_id",
          });
        }
      }
    } catch (err: any) {
      result.failed += prices.length;
      const message = err?.response?.data?.message ?? err?.message ?? "Ошибка Ozon API";
      for (const p of prices) {
        result.errors.push({ productId: p.offer_id, message });
      }
    }
  }

  return result;
}
