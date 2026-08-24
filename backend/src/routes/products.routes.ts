import { Router } from "express";
import { getProductsHandler } from "../controllers/products.controller.js";

const router = Router();

/**
 * Список товаров магазина (из БД)
 *
 * GET /api/products/:shopId
 */
router.get("/:shopId", getProductsHandler);

export default router;
