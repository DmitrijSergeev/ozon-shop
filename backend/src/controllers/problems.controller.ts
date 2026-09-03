import { asyncHandler } from "../utils/asyncHandler.js";
import { getShopForUser } from "../services/shop.service.js";
import { getProblems, resolveProblem } from "../services/problems.service.js";
import { resolveProblemSchema } from "../schemas/problems.schema.js";

/**
 * GET /api/problems/:shopId
 *
 * Список проблем по категориям.
 */
export const getProblemsHandler = asyncHandler(async (req, res) => {
  await getShopForUser(req.userId!, req.params.shopId);

  const problems = await getProblems(req.params.shopId);

  res.json(problems);
});

/**
 * POST /api/problems/:shopId/resolve
 *
 * Отметить проблему как решённую.
 */
export const resolveProblemHandler = asyncHandler(async (req, res) => {
  await getShopForUser(req.userId!, req.params.shopId);

  const input = resolveProblemSchema.parse(req.body);

  await resolveProblem(req.params.shopId, input.productId, input.type);

  res.json({ ok: true });
});
