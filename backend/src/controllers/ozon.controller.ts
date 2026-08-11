import { Request, Response } from "express";
import {
  getOzonProducts,
  type GetProductsParams,
} from "../services/ozon.service.js";

export async function getOzonProductsHandler(
  req: Request,
  res: Response
) {
  try {
    /*
     * Пагинация
     */

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const lastId = String(
      req.query.last_id || ""
    );

    /*
     * Поиск
     */

    const search = String(
      req.query.search || ""
    );

    const searchType =
      String(req.query.searchType || "offer_id") as
        | "offer_id"
        | "product_id"
        | "sku";

    /*
     * Фильтры
     */

    const fboOnly =
      req.query.fboOnly === "true";

    const fbsOnly =
      req.query.fbsOnly === "true";

    const archivedOnly =
      req.query.archivedOnly === "true";

    const discountedOnly =
      req.query.discountedOnly === "true";

    console.log("🔥 GET OZON PRODUCTS");
    console.log("🔎 Search:", search);
    console.log("🔎 Search type:", searchType);
    console.log("📄 Last ID:", lastId);
    console.log("📦 Limit:", limit);

    console.log("📦 FBO:", fboOnly);
    console.log("📦 FBS:", fbsOnly);
    console.log("📦 Archived:", archivedOnly);
    console.log("📦 Discounted:", discountedOnly);

    /*
     * Проверяем тип поиска.
     */

    if (
      !["offer_id", "product_id", "sku"].includes(
        searchType
      )
    ) {
      return res.status(400).json({
        message: "Неверный searchType",
        allowed: [
          "offer_id",
          "product_id",
          "sku",
        ],
      });
    }

    /*
     * Для product_id и sku проверяем,
     * что передано число.
     */

    if (
      search &&
      (searchType === "product_id" ||
        searchType === "sku") &&
      !/^\d+$/.test(search.trim())
    ) {
      return res.status(400).json({
        message: `${searchType} должен быть числом`,
      });
    }

    const params: GetProductsParams = {
      lastId,
      limit,
      search,
      searchType,

      fboOnly,
      fbsOnly,
      archivedOnly,
      discountedOnly,
    };

    const products =
      await getOzonProducts(params);

    res.json(products);
  } catch (error: any) {
    console.error(
      "❌ Ошибка при запросе к Ozon:"
    );

    console.error(
      error.response?.data || error
    );

    res.status(500).json({
      message: "Ozon request failed",

      error: error.message,

      ozonError:
        error.response?.data || null,
    });
  }
}
