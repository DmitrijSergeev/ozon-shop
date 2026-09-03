import { Router } from "express";
import {
  getProblemsHandler,
  resolveProblemHandler,
} from "../controllers/problems.controller.js";

const router = Router();

/**
 * GET /api/problems/:shopId
 */
router.get("/:shopId", getProblemsHandler);

/**
 * POST /api/problems/:shopId/resolve
 */
router.post("/:shopId/resolve", resolveProblemHandler);

export default router;
