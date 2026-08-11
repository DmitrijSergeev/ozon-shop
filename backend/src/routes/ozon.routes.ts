import { Router } from "express";

import {
    getOzonProductsHandler,
    getOzonProductHandler,
} from "../controllers/ozon.controller.js";

const router = Router();


// Список товаров
// GET /api/ozon/products
router.get(
    "/products",
    getOzonProductsHandler
);


// Один товар 3056876257
// GET /api/ozon/products/:productId
router.get(
    "/products/:productId",
    getOzonProductHandler
);

export default router;