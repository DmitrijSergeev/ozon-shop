import { asyncHandler } from "../utils/asyncHandler.js";
import { getShopForUser } from "../services/shop.service.js";
import { getAnalytics } from "../services/analytics.service.js";
import { analyticsQuerySchema } from "../schemas/analytics.schema.js";

/**
 * GET /api/analytics/:shopId
 *
 * Аналитика: выручка и заказы по дням, ТОП-10 товаров, товары без продаж.
 */
export const getAnalyticsHandler = asyncHandler(async (req, res) => {
  await getShopForUser(req.userId!, req.params.shopId);

  const query = analyticsQuerySchema.parse(req.query);

  const result = await getAnalytics(req.params.shopId, query);

  res.json(result);
});
