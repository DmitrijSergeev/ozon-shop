import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createShop,
  listShops,
  connectOzon,
} from "../services/shop.service.js";

export const createShopHandler = asyncHandler(async (req, res) => {
  const shop = await createShop(req.userId!, req.body.name);
  res.status(201).json(shop);
});

export const listShopsHandler = asyncHandler(async (req, res) => {
  const shops = await listShops(req.userId!);
  res.json(shops);
});

export const connectOzonHandler = asyncHandler(async (req, res) => {
  const { clientId, apiKey } = req.body;
  const result = await connectOzon(req.userId!, req.params.shopId, clientId, apiKey);
  res.json(result);
});
