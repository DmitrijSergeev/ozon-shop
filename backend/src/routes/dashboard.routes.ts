import { Router } from "express";
import {
  getDashboardHandler,
  getAttentionHandler,
} from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/:shopId/dashboard", getDashboardHandler);
router.get("/:shopId/attention", getAttentionHandler);

export default router;
