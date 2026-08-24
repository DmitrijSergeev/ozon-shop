import { asyncHandler } from "../utils/asyncHandler.js";
import { getDashboard, getAttention } from "../services/dashboard.service.js";
import { getShopForUser } from "../services/shop.service.js";

export const getDashboardHandler = asyncHandler(async (req, res) => {
  await getShopForUser(req.userId!, req.params.shopId);
  const dashboard = await getDashboard(req.params.shopId);
  res.json(dashboard);
});

export const getAttentionHandler = asyncHandler(async (req, res) => {
  await getShopForUser(req.userId!, req.params.shopId);
  const attention = await getAttention(req.params.shopId);
  res.json(attention);
});
