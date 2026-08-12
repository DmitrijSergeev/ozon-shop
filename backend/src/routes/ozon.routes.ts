import { Router } from "express";

import {
    getOzonProductsHandler,
    getOzonProductDetailsHandler,
} from "../controllers/ozon.controller.js";

const router = Router();

/**
 * Список товаров
 *
 * GET /api/ozon/products
 */
router.get(
    "/products",
    getOzonProductsHandler,
);

/**
 * Подробная информация о товаре
 *
 * GET /api/ozon/products/:productId
 */
router.get(
    "/products/:productId",
    getOzonProductDetailsHandler,
);

export default router;