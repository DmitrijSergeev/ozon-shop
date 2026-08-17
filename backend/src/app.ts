import express from "express";
import cors from "cors";

import ozonRouter from "./routes/ozon.routes.js";
import productRouter from "./routes/product.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { NotFoundError } from "./errors/NotFoundError.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/ozon", ozonRouter);
app.use("/api/products", productRouter);

app.use((_req, _res, next) => {
  next(new NotFoundError("Route not found"));
});

app.use(errorMiddleware);
