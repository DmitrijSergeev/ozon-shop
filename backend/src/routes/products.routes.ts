import { Router } from "express";
import {
  getProductsHandler,
} from "../controllers/products.controller.js";
import {
  getProductDetailsHandler,
} from "../controllers/product-details.controller.js";

const router = Router();

/**
 * Список товаров магазина (из БД)
 *
 * GET /api/products/:shopId
 */
router.get("/:shopId", getProductsHandler);

/**
 * Карточка товара (из БД)
 *
 * GET /api/products/:shopId/:productId
 */
router.get("/:shopId/:productId", getProductDetailsHandler);

export default router;
