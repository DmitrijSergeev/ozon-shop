import { Router } from "express";
import { getStocksHandler } from "../controllers/stocks.controller.js";

const router = Router();

/**
 * GET /api/stocks/:shopId
 */
router.get("/:shopId", getStocksHandler);

export default router;
