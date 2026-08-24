import { AppError } from "./AppError.js";

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(409, message);
  }
}
