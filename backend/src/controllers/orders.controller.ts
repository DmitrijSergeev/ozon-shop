import { asyncHandler } from "../utils/asyncHandler.js";
import { getShopForUser } from "../services/shop.service.js";
import { getOrders, getOrderStatuses } from "../services/orders.service.js";
import { ordersQuerySchema } from "../schemas/orders.schema.js";

/**
 * GET /api/orders/:shopId
 *
 * Список заказов с фильтрами (дата, статус, товар).
 */
export const getOrdersHandler = asyncHandler(async (req, res) => {
  await getShopForUser(req.userId!, req.params.shopId);

  const query = ordersQuerySchema.parse(req.query);

  const page = await getOrders(req.params.shopId, query);

  res.json(page);
});

/**
 * GET /api/orders/:shopId/statuses
 *
 * Список уникальных статусов заказов магазина.
 */
export const getOrderStatusesHandler = asyncHandler(async (req, res) => {
  await getShopForUser(req.userId!, req.params.shopId);

  const statuses = await getOrderStatuses(req.params.shopId);

  res.json({ statuses });
});
