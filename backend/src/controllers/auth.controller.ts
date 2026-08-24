import { asyncHandler } from "../utils/asyncHandler.js";
import { register, login } from "../services/auth.service.js";

export const registerHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await register(email, password);
  res.status(201).json(result);
});

export const loginHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await login(email, password);
  res.json(result);
});
