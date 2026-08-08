import { Request, Response } from "express";
import { getOzonProducts } from "../services/ozon.service.js";

export async function getOzonProductsHandler(
  req: Request,
  res: Response
) {
  try {
    const products = await getOzonProducts();

    res.json(products);
  } catch (error: any) {
  console.error("❌ Ошибка при запросе к Ozon:", error);

  console.error("📦 Ответ Ozon:", error.response?.data);

  res.status(500).json({
    message: "Ozon request failed",
    error: error.message,
    ozonError: error.response?.data,
  });
}
}