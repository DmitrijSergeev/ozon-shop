import { Router } from "express";
import { syncShopHandler, getLastSyncHandler } from "../controllers/sync.controller.js";

const router = Router();

router.post("/:shopId/sync", syncShopHandler);
router.get("/:shopId/last", getLastSyncHandler);

export default router;
