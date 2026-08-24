import { asyncHandler } from "../utils/asyncHandler.js";
import { productsQuerySchema } from "../schemas/products.schema.js";
import { getProducts } from "../services/products.service.js";
import { getShopForUser } from "../services/shop.service.js";

/**
 * GET /api/products/:shopId
 *
 * Список товаров магазина из БД с поиском, фильтрами и сортировкой.
 */
export const getProductsHandler = asyncHandler(async (req, res) => {
  await getShopForUser(req.userId!, req.params.shopId);

  const query = productsQuerySchema.parse(req.query);
  const page = await getProducts(req.params.shopId, query);

  res.json(page);
});
