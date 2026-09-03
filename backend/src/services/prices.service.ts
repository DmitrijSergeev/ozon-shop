import { prisma } from "../lib/prisma.js";
import { getOzonCredentials } from "./shop.service.js";
import { createOzonModule } from "../ozon/index.js";

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
  const ozon = createOzonModule(credentials);

  const result: PriceUpdateResult = { updated: 0, failed: 0, errors: [] };

  // Получаем товары по id, чтобы знать их ozonId (product_id) и offer_id для Ozon API
  const products = await prisma.product.findMany({
    where: { shopId, id: { in: updates.map((u) => u.productId) } },
    select: { id: true, ozonId: true, offerId: true },
  });

  const productById = new Map(products.map((p) => [p.id, p]));

  // Маппим доменные обновления в формат Ozon-сервиса
  const ozonUpdates = updates
    .map((u) => {
      const product = productById.get(u.productId);
      if (!product) return null;

      return {
        offerId: product.offerId,
        productId: Number(product.ozonId),
        price: u.price,
      };
    })
    .filter((u): u is NonNullable<typeof u> => u !== null);

  if (ozonUpdates.length === 0) {
    return result;
  }

  try {
    // OzonPricesService сам разбивает на батчи до 1000 и возвращает task_id
    const taskIds = await ozon.prices.updatePrices(ozonUpdates);

    if (taskIds.length > 0) {
      result.updated += ozonUpdates.length;

      // Обновляем локальную цену в БД
      for (const u of ozonUpdates) {
        const product = products.find((p) => p.offerId === u.offerId);
        if (!product) continue;

        await prisma.price.upsert({
          where: { productId: product.id },
          create: {
            shopId,
            productId: product.id,
            price: u.price,
            currency: "RUB",
          },
          update: {
            price: u.price,
            currency: "RUB",
          },
        });
      }
    } else {
      result.failed += ozonUpdates.length;
      for (const u of ozonUpdates) {
        result.errors.push({
          productId: u.offerId,
          message: "Ozon не вернул task_id",
        });
      }
    }
  } catch (err: any) {
    result.failed += ozonUpdates.length;
    const message = err?.response?.data?.message ?? err?.message ?? "Ошибка Ozon API";
    for (const u of ozonUpdates) {
      result.errors.push({ productId: u.offerId, message });
    }
  }

  return result;
}
