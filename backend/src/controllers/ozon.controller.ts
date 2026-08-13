import { Request, Response } from "express";

import {
    getOzonProducts,
    getOzonProductDetails,
    type SearchType,
} from "../services/ozon.service.js";

/**
 * GET /api/ozon/products
 *
 * Получение списка товаров.
 */
export async function getOzonProductsHandler(
    req: Request,
    res: Response,
) {
    try {
        /**
         * Количество товаров на странице.
         *
         * Мы разрешаем frontend передавать limit,
         * но ограничиваем его диапазоном 1-100.
         *
         * Фактически frontend сейчас использует 20.
         */
        const requestedLimit =
            Number(req.query.limit) || 20;

        const limit = Math.min(
            Math.max(requestedLimit, 1),
            100,
        );

        /**
         * Cursor Ozon.
         */
        const lastId =
            String(
                req.query.last_id || "",
            );

        /**
         * Поисковая строка.
         */
        const search =
            String(
                req.query.search || "",
            );

        /**
         * Тип поиска.
         */
        const rawSearchType =
            String(
                req.query.searchType || "",
            );

        const searchType: SearchType =
            rawSearchType === "product_id"
                ? "product_id"
                : rawSearchType === "sku"
                    ? "sku"
                    : "offer_id";

        /**
         * Фильтры.
         */
        const fbo =
            req.query.fbo === "true";

        const fbs =
            req.query.fbs === "true";

        const archived =
            req.query.archived === "true";

        const discounted =
            req.query.discounted === "true";

        console.log(
            "🔎 Search:",
            search,
        );

        console.log(
            "🔎 Search type:",
            searchType,
        );

        console.log(
            "📄 Last ID:",
            lastId,
        );

        console.log(
            "📦 Limit:",
            limit,
        );

        console.log(
            "📦 FBO:",
            fbo,
        );

        console.log(
            "📦 FBS:",
            fbs,
        );

        console.log(
            "📦 Archived:",
            archived,
        );

        console.log(
            "📦 Discounted:",
            discounted,
        );

        const products =
            await getOzonProducts({
                lastId,
                limit,
                search,
                searchType,

                fbo,
                fbs,
                archived,
                discounted,
            });

        res.json(products);
    } catch (error: any) {
        console.error(
            "❌ Ошибка при запросе списка товаров Ozon:",
        );

        console.error(
            error.response?.data ||
            error,
        );

        res.status(500).json({
            message:
                "Ozon request failed",

            error:
            error.message,

            ozonError:
            error.response?.data,
        });
    }
}

/**
 * GET /api/ozon/products/:productId
 *
 * Получение подробной информации
 * о конкретном товаре.
 */
export async function getOzonProductDetailsHandler(
    req: Request,
    res: Response,
) {
    try {
        const productId =
            Number(
                req.params.productId,
            );

        if (
            !Number.isInteger(
                productId,
            ) ||
            productId <= 0
        ) {
            return res.status(400).json({
                message:
                    "Некорректный productId",
            });
        }

        console.log(
            `🔎 Запрос деталей товара: ${productId}`,
        );

        const data =
            await getOzonProductDetails(
                productId,
            );

        if (
            !data?.items ||
            data.items.length === 0
        ) {
            return res.status(404).json({
                message:
                    "Товар не найден",
            });
        }

        res.json(
            data.items[0],
        );
    } catch (error: any) {
        console.error(
            "❌ Ошибка при запросе подробной информации о товаре Ozon:",
        );

        console.error(
            error.response?.data ||
            error,
        );

        res.status(500).json({
            message:
                "Ozon product details request failed",

            error:
            error.message,

            ozonError:
            error.response?.data,
        });
    }
}