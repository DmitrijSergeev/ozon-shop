import { Request, Response } from "express";

import {
    getOzonProducts,
    getOzonProductById,
} from "../services/ozon.service.js";


export async function getOzonProductsHandler(
    req: Request,
    res: Response
) {
    try {
        const limit = Math.min(
            Number(req.query.limit) || 20,
            100
        );

        const lastId = String(
            req.query.last_id || ""
        );

        const search = String(
            req.query.search || ""
        );

        const searchType =
            String(
                req.query.search_type || "offer_id"
            ) as "offer_id" | "product_id" | "sku";

        console.log("🔎 Search:", search);
        console.log("🔍 Search type:", searchType);
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
        console.error(
            error.response?.data || error
        );

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
 * Получение подробной информации
 * об одном товаре.
 */
export async function getOzonProductHandler(
    req: Request,
    res: Response
) {
    try {
        const productId = Number(
            req.params.productId
        );

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                message: "Invalid product_id",
            });
        }

        console.log(
            "🔎 Запрос товара:",
            productId
        );

        const product =
            await getOzonProductById(productId);

        res.json(product);

    } catch (error: any) {
        console.error(
            "❌ Ошибка при запросе товара Ozon:"
        );

        console.error(
            error.response?.data || error
        );

        const status =
            error.response?.status || 500;

        res.status(status).json({
            message: "Ozon product request failed",
            error: error.message,
            ozonError: error.response?.data,
        });
    }
}