import { Request, Response } from "express";
import {
    getOzonProducts,
    getOzonProductDetails,
} from "../services/ozon.service.js";

/**
 * GET /api/ozon/products
 *
 * Получение списка товаров
 */
export async function getOzonProductsHandler(
    req: Request,
    res: Response,
) {
    try {
        const limit = Math.min(
            Number(req.query.limit) || 20,
            100,
        );

        const lastId = String(req.query.last_id || "");
        const search = String(req.query.search || "");

        const searchType =
            req.query.search_type === "product_id" ||
            req.query.search_type === "sku"
                ? req.query.search_type
                : "offer_id";

        console.log("🔎 Search:", search);
        console.log("🔎 Search type:", searchType);
        console.log("📄 Last ID:", lastId);
        console.log("📦 Limit:", limit);

        const products = await getOzonProducts({
            lastId,
            limit,
            search,
            searchType,
        });

        res.json(products);
    } catch (error: any) {
        console.error("❌ Ошибка при запросе списка товаров Ozon:");
        console.error(error.response?.data || error);

        res.status(500).json({
            message: "Ozon request failed",
            error: error.message,
            ozonError: error.response?.data,
        });
    }
}

/**
 * GET /api/ozon/products/:productId
 *
 * Получение подробной информации о конкретном товаре
 */
export async function getOzonProductDetailsHandler(
    req: Request,
    res: Response,
) {
    try {
        const productId = Number(req.params.productId);

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                message: "Некорректный productId",
            });
        }

        console.log(
            `🔎 Запрос деталей товара: ${productId}`,
        );

        const data = await getOzonProductDetails(productId);

        if (!data?.items || data.items.length === 0) {
            return res.status(404).json({
                message: "Товар не найден",
            });
        }

        res.json(data.items[0]);
    } catch (error: any) {
        console.error(
            "❌ Ошибка при запросе подробной информации о товаре Ozon:",
        );

        console.error(
            error.response?.data || error,
        );

        res.status(500).json({
            message: "Ozon product details request failed",
            error: error.message,
            ozonError: error.response?.data,
        });
    }
}