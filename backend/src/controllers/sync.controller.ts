import { asyncHandler } from "../utils/asyncHandler.js";
import { syncShop } from "../services/sync.service.js";
import { getShopForUser } from "../services/shop.service.js";

export const syncShopHandler = asyncHandler(async (req, res) => {
  await getShopForUser(req.userId!, req.params.shopId);
  const result = await syncShop(req.params.shopId);
  res.json(result);
});
