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
 *
 * Поддерживает:
 *
 * ?search=...
 * ?searchType=offer_id
 * ?searchType=product_id
 * ?searchType=sku
 *
 * ?last_id=...
 * ?limit=20
 *
 * ?fbo=true
 * ?fbs=true
 * ?archived=true
 * ?discounted=true
 */
export async function getOzonProductsHandler(
    req: Request,
    res: Response,
) {
    try {
        /*
         * -------------------------------------------------------
         * LIMIT
         * -------------------------------------------------------
         */

        const limit = Math.min(
            Math.max(
                Number(req.query.limit) || 20,
                1,
            ),
            100,
        );

        /*
         * -------------------------------------------------------
         * PAGINATION
         * -------------------------------------------------------
         */

        const lastId = String(
            req.query.last_id || "",
        );

        /*
         * -------------------------------------------------------
         * SEARCH
         * -------------------------------------------------------
         */

        const search = String(
            req.query.search || "",
        );

        /*
         * -------------------------------------------------------
         * SEARCH TYPE
         * -------------------------------------------------------
         *
         * Frontend сейчас отправляет:
         *
         * searchType
         *
         * Поэтому читаем именно его.
         *
         * Одновременно поддерживаем старый вариант:
         *
         * search_type
         */

        const requestedSearchType =
            req.query.searchType ||
            req.query.search_type;

        const searchType: SearchType =
            requestedSearchType === "product_id" ||
            requestedSearchType === "sku"
                ? requestedSearchType
                : "offer_id";

        /*
         * -------------------------------------------------------
         * FILTERS
         * -------------------------------------------------------
         */

        const fbo =
            req.query.fbo === "true";

        const fbs =
            req.query.fbs === "true";

        const archived =
            req.query.archived === "true";

        const discounted =
            req.query.discounted === "true";

        /*
         * -------------------------------------------------------
         * DEBUG
         * -------------------------------------------------------
         */

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
            "🔵 FBO:",
            fbo,
        );

        console.log(
            "🟢 FBS:",
            fbs,
        );

        console.log(
            "📦 Archived:",
            archived,
        );

        console.log(
            "🏷️ Discounted:",
            discounted,
        );

        /*
         * -------------------------------------------------------
         * Ozon service
         * -------------------------------------------------------
         */

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

        /*
         * -------------------------------------------------------
         * RESPONSE
         * -------------------------------------------------------
         */

        res.json(products);
    } catch (error: any) {
        console.error(
            "❌ Ошибка при запросе списка товаров Ozon:",
        );

        console.error(
            error.response?.data || error,
        );

        res.status(500).json({
            message: "Ozon request failed",

            error: error.message,

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
        const productId = Number(
            req.params.productId,
        );

        /*
         * Проверяем productId
         */

        if (
            !Number.isInteger(productId) ||
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

        /*
         * Запрашиваем товар у Ozon
         */

        const data =
            await getOzonProductDetails(
                productId,
            );

        /*
         * Проверяем наличие товара
         */

        if (
            !data?.items ||
            data.items.length === 0
        ) {
            return res.status(404).json({
                message:
                    "Товар не найден",
            });
        }

        /*
         * Возвращаем один товар
         */

        return res.json(
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

        return res.status(500).json({
            message:
                "Ozon product details request failed",

            error: error.message,

            ozonError:
            error.response?.data,
        });
    }
}