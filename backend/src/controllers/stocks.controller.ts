import { asyncHandler } from "../utils/asyncHandler.js";
import { getShopForUser } from "../services/shop.service.js";
import { getStocks } from "../services/stocks.service.js";
import { stocksQuerySchema } from "../schemas/stocks.schema.js";

/**
 * GET /api/stocks/:shopId
 *
 * Список товаров с остатками, скоростью продаж и прогнозом.
 */
export const getStocksHandler = asyncHandler(async (req, res) => {
  await getShopForUser(req.userId!, req.params.shopId);

  const query = stocksQuerySchema.parse(req.query);

  const page = await getStocks(req.params.shopId, query);

  res.json(page);
});
