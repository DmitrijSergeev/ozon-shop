import express from "express";
import productRoutes from "./routes/product.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());

app.use("/api/products", productRoutes);

app.use("/api/products", productRoutes);

// ⬇️ Всегда подключается ПОСЛЕ маршрутов
app.use(errorMiddleware);

app.listen(3000, () => {
  console.log("🚀 Server started on http://localhost:3000");
});