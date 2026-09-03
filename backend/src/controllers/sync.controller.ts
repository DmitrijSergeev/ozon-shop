import { asyncHandler } from "../utils/asyncHandler.js";
import { syncShop, getLastSync } from "../services/sync.service.js";
import { getShopForUser } from "../services/shop.service.js";

/**
 * POST /api/sync/:shopId/sync
 *
 * Ручной запуск синхронизации (кнопка «Обновить сейчас»).
 * type: frequent | infrequent | full (по умолчанию full).
 */
export const syncShopHandler = asyncHandler(async (req, res) => {
  await getShopForUser(req.userId!, req.params.shopId);

  const type = (req.body?.type as string) || "full";
  const result = await syncShop(req.params.shopId, type as any);

  res.json(result);
});

/**
 * GET /api/sync/:shopId/last
 *
 * Последняя успешная синхронизация.
 */
export const getLastSyncHandler = asyncHandler(async (req, res) => {
  await getShopForUser(req.userId!, req.params.shopId);

  const last = await getLastSync(req.params.shopId);

  res.json({ last });
});
