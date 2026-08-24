import express from "express";
import cors from "cors";

import authRouter from "./routes/auth.routes.js";
import shopRouter from "./routes/shop.routes.js";
import syncRouter from "./routes/sync.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import ozonRouter from "./routes/ozon.routes.js";
import productsRouter from "./routes/products.routes.js";
import { authMiddleware } from "./middleware/auth.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { NotFoundError } from "./errors/NotFoundError.js";

export const app = express();

app.use(cors());
app.use(express.json());

// Публичные маршруты
app.use("/api/auth", authRouter);

// Защищённые маршруты
app.use("/api/shops", authMiddleware, shopRouter);
app.use("/api/sync", authMiddleware, syncRouter);
app.use("/api/dashboard", authMiddleware, dashboardRouter);
app.use("/api/ozon", authMiddleware, ozonRouter);
app.use("/api/products", authMiddleware, productsRouter);

app.use((_req, _res, next) => {
  next(new NotFoundError("Route not found"));
});

app.use(errorMiddleware);
