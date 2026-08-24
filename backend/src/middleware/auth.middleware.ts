import { RequestHandler } from "express";
import { verifyToken } from "../lib/jwt.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authMiddleware: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Требуется авторизация"));
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    next(new UnauthorizedError("Недействительный токен"));
  }
};
