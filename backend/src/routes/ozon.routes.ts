import { Router } from "express";
import { getOzonProductsHandler } from "../controllers/ozon.controller.js";

const router = Router();

router.get("/products", getOzonProductsHandler);

export default router;