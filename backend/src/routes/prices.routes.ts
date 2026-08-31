import { Router } from "express";
import {
  getPricesHandler,
  updatePricesHandler,
} from "../controllers/prices.controller.js";

const router = Router();

/**
 * GET /api/prices/:shopId
 */
router.get("/:shopId", getPricesHandler);

/**
 * POST /api/prices/:shopId/update
 */
router.post("/:shopId/update", updatePricesHandler);

export default router;
