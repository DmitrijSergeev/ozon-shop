import express from "express";
import cors from "cors";
import ozonRouter from "./routes/ozon.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/ozon", ozonRouter);

app.listen(3000, () => {
  console.log("🚀 Server started on http://localhost:3000");
});