import { asyncHandler } from "../utils/asyncHandler.js";
import { ozonProductsQuerySchema } from "../schemas/ozon.schema.js";
import {
  getOzonProducts,
  getOzonProductDetails,
} from "../services/ozon.service.js";

/**
 * GET /api/ozon/products
 *
 * Получение списка товаров.
 */
export const getOzonProductsHandler = asyncHandler(async (req, res) => {
  const query = ozonProductsQuerySchema.parse(req.query);

  const products = await getOzonProducts({
    lastId: query.last_id,
    limit: query.limit,
    search: query.search,
    searchType: query.searchType,
    fbo: query.fbo,
    fbs: query.fbs,
    archived: query.archived,
    discounted: query.discounted,
  });

  res.json(products);
});

/**
 * GET /api/ozon/products/:productId
 *
 * Получение подробной информации о конкретном товаре.
 */
export const getOzonProductDetailsHandler = asyncHandler(async (req, res) => {
  const productId = Number(req.params.productId);

  if (!Number.isInteger(productId) || productId <= 0) {
    res.status(400).json({ message: "Некорректный productId" });
    return;
  }

  const data = await getOzonProductDetails(productId);

  if (!data?.items || data.items.length === 0) {
    res.status(404).json({ message: "Товар не найден" });
    return;
  }

  res.json(data.items[0]);
});
