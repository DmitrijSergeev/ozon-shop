import { asyncHandler } from "../utils/asyncHandler.js";
import { getShopForUser } from "../services/shop.service.js";
import { getPrices, updatePrices } from "../services/prices.service.js";
import { updatePricesSchema } from "../schemas/prices.schema.js";

/**
 * GET /api/prices/:shopId
 *
 * Список товаров с текущими ценами.
 */
export const getPricesHandler = asyncHandler(async (req, res) => {
  await getShopForUser(req.userId!, req.params.shopId);

  const page = await getPrices(req.params.shopId);

  res.json(page);
});

/**
 * POST /api/prices/:shopId/update
 *
 * Обновление цен (одиночное или массовое) через Ozon API.
 */
export const updatePricesHandler = asyncHandler(async (req, res) => {
  await getShopForUser(req.userId!, req.params.shopId);

  const { updates } = updatePricesSchema.parse(req.body);

  const result = await updatePrices(req.params.shopId, updates);

  res.json(result);
});
