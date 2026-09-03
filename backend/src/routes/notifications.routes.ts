import { Router } from "express";
import {
  getNotificationSettingsHandler,
  updateNotificationSettingsHandler,
} from "../controllers/notifications.controller.js";

const router = Router();

/**
 * GET /api/notifications/settings
 */
router.get("/settings", getNotificationSettingsHandler);

/**
 * PUT /api/notifications/settings
 */
router.put("/settings", updateNotificationSettingsHandler);

export default router;
