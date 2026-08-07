import express from "express";
import { prisma } from "./lib/prisma.js";

const app = express();

app.get("/", async (_, res) => {
  const count = await prisma.product.count();

  res.json({
    message: "Backend works!",
    products: count,
  });
});

app.listen(3000, () => {
  console.log("🚀 Server started: http://localhost:3000");
});