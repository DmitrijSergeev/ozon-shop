import { Request, Response } from "express";
import { getOzonProducts } from "../services/ozon.service.js";

export async function getOzonProductsHandler(
    req: Request,
    res: Response
) {
  try {
    const limit = Math.min(
        Number(req.query.limit) || 20,
        100
    );

    const lastId = String(req.query.last_id || "");
    const search = String(req.query.search || "");

    console.log("🔎 Search:", search);
    console.log("📄 Last ID:", lastId);
    console.log("📦 Limit:", limit);

    const products = await getOzonProducts({
      lastId,
      limit,
      search,
    });

    res.json(products);
  } catch (error: any) {
    console.error("❌ Ошибка при запросе к Ozon:");
    console.error(error.response?.data || error);

    res.status(500).json({
      message: "Ozon request failed",
      error: error.message,
      ozonError: error.response?.data,
    });
  }
}
//MF3030-BLACK-10  3018083923