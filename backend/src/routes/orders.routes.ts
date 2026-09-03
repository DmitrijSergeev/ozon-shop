import { Router } from "express";
import {
  getOrdersHandler,
  getOrderStatusesHandler,
} from "../controllers/orders.controller.js";

const router = Router();

/**
 * GET /api/orders/:shopId
 */
router.get("/:shopId", getOrdersHandler);

/**
 * GET /api/orders/:shopId/statuses
 */
router.get("/:shopId/statuses", getOrderStatusesHandler);

export default router;
