import { Router } from "express";
import {
  createShopHandler,
  listShopsHandler,
  connectOzonHandler,
} from "../controllers/shop.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { createShopSchema, connectOzonSchema } from "../schemas/shop.schema.js";

const router = Router();

router.post("/", validate(createShopSchema), createShopHandler);
router.get("/", listShopsHandler);
router.post("/:shopId/connect-ozon", validate(connectOzonSchema), connectOzonHandler);

export default router;
