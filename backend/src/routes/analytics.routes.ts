import { Router } from "express";
import { getAnalyticsHandler } from "../controllers/analytics.controller.js";

const router = Router();

/**
 * GET /api/analytics/:shopId
 */
router.get("/:shopId", getAnalyticsHandler);

export default router;
