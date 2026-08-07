import { Router } from "express";
import {
  getProductsHandler,
  getProductByIdHandler,
  createProductHandler,
} from "../controllers/product.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { createProductSchema } from "../schemas/product.schema.js";

const router = Router();

router.post(
  "/",
  validate(createProductSchema),
  createProductHandler
);

router.get("/", getProductsHandler);

router.get("/:id", getProductByIdHandler);

export default router;