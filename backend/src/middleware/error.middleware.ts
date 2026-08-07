import { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { ZodError } from "zod";

export const errorMiddleware: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next
) => {
  console.error(err);

  if (err instanceof ZodError) {
  return res.status(400).json({
    message: "Validation failed",
    errors: err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
}

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  res.status(500).json({
    message: "Internal Server Error",
  });
};