import { asyncHandler } from "../utils/asyncHandler.js";
import { getProductDetails } from "../services/product-details.service.js";
import { getShopForUser } from "../services/shop.service.js";

/**
 * GET /api/products/:shopId/:productId
 *
 * Карточка товара из БД: цены, остатки, продажи, график за 30 дней.
 */
export const getProductDetailsHandler = asyncHandler(async (req, res) => {
  await getShopForUser(req.userId!, req.params.shopId);

  const details = await getProductDetails(
    req.params.shopId,
    req.params.productId,
  );

  res.json(details);
});
