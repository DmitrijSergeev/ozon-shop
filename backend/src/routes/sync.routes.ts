import { Router } from "express";
import { syncShopHandler } from "../controllers/sync.controller.js";

const router = Router();

router.post("/:shopId/sync", syncShopHandler);

export default router;
