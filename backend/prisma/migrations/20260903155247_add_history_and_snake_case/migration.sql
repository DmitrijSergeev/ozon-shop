-- Переименование существующих таблиц в snake_case (без потери данных)
ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "Shop" RENAME TO "shops";
ALTER TABLE "OzonConnection" RENAME TO "ozon_connections";
ALTER TABLE "Product" RENAME TO "products";
ALTER TABLE "Stock" RENAME TO "product_stocks";
ALTER TABLE "Price" RENAME TO "product_prices";
ALTER TABLE "Order" RENAME TO "orders";
ALTER TABLE "OrderItem" RENAME TO "order_items";
ALTER TABLE "SyncJob" RENAME TO "sync_jobs";
ALTER TABLE "Problem" RENAME TO "problems";
ALTER TABLE "NotificationSetting" RENAME TO "notifications";

-- Переименование внешних ключей и индексов (PostgreSQL автоматически
-- переименовывает constraint'ы при RENAME TABLE, но имена индексов
-- остаются прежними — это допустимо, Prisma не требует точных имён).

-- =========================
-- ИСТОРИЯ (снапшоты)
-- =========================

CREATE TABLE "product_stock_history" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_stock_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_price_history" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "oldPrice" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_price_history_pkey" PRIMARY KEY ("id")
);

-- =========================
-- ЕЖЕДНЕВНАЯ АГРЕГАЦИЯ ПРОДАЖ
-- =========================

CREATE TABLE "sales_daily" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_daily_pkey" PRIMARY KEY ("id")
);

-- Индексы для новых таблиц
CREATE INDEX "product_stock_history_productId_createdAt_idx" ON "product_stock_history"("productId", "createdAt");
CREATE INDEX "product_stock_history_shopId_createdAt_idx" ON "product_stock_history"("shopId", "createdAt");
CREATE INDEX "product_price_history_productId_createdAt_idx" ON "product_price_history"("productId", "createdAt");
CREATE INDEX "product_price_history_shopId_createdAt_idx" ON "product_price_history"("shopId", "createdAt");
CREATE INDEX "sales_daily_shopId_date_idx" ON "sales_daily"("shopId", "date");
CREATE UNIQUE INDEX "sales_daily_shopId_productId_date_key" ON "sales_daily"("shopId", "productId", "date");

-- Внешние ключи для новых таблиц
ALTER TABLE "product_stock_history" ADD CONSTRAINT "product_stock_history_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_stock_history" ADD CONSTRAINT "product_stock_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_daily" ADD CONSTRAINT "sales_daily_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_daily" ADD CONSTRAINT "sales_daily_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
