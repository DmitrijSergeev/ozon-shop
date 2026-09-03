"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

import {
  getProductDetails,
  type ProductDetailsData,
  type StockStatus,
} from "../api/productDetails";
import { useShop } from "../hooks/useShop";

function formatMoney(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  green: "🟢 Более 14 дней",
  yellow: "🟡 7–14 дней",
  orange: "🟠 3–7 дней",
  red: "🔴 Менее 3 дней",
  unknown: "⚪ Нет данных",
};

function ProductDetails() {
  const params = useParams();
  const productId = Array.isArray(params.productId)
    ? params.productId[0]
    : params.productId;
  const router = useRouter();

  const { shopId } = useShop();
  const [product, setProduct] = useState<ProductDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shopId || !productId) return;

    let ignore = false;

    setLoading(true);
    setError("");

    getProductDetails(shopId, productId)
      .then((data) => {
        if (!ignore) setProduct(data);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Ошибка");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [shopId, productId]);

  if (loading) {
    return (
      <main className="product-details">
        <p>Загрузка товара...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="product-details">
        <button type="button" onClick={() => router.back()}>
          ← Назад
        </button>
        <p className="auth-error">{error}</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="product-details">
        <button type="button" onClick={() => router.back()}>
          ← Назад
        </button>
        <p>Товар не найден</p>
      </main>
    );
  }

  const maxChartRevenue = Math.max(
    1,
    ...product.salesChart.map((p) => p.revenue),
  );

  return (
    <main className="product-details">
      <button type="button" onClick={() => router.push("/products")}>
        ← Назад к товарам
      </button>

      <div className="product-details-header">
        <div className="product-details-images">
          {product.image ? (
            <img src={product.image} alt={product.name ?? "Товар"} />
          ) : (
            <div className="product-image-placeholder">Нет изображения</div>
          )}
        </div>

        <div className="product-details-main">
          <h1>{product.name || `Товар ${product.offerId}`}</h1>

          <dl className="product-meta">
            <div>
              <dt>Артикул</dt>
              <dd>{product.offerId}</dd>
            </div>
            <div>
              <dt>SKU</dt>
              <dd>{product.sku ?? "—"}</dd>
            </div>
            <div>
              <dt>Ozon ID</dt>
              <dd>{product.ozonId}</dd>
            </div>
          </dl>

          <div className="product-price">
            <strong>{formatMoney(product.price)}</strong>
            {product.oldPrice !== null && (
              <span className="product-old-price">
                {formatMoney(product.oldPrice)}
              </span>
            )}
          </div>

          <div className="product-sales-summary">
            <div>
              <span className="metric-label">Продажи</span>
              <span className="metric-value">{product.sales}</span>
            </div>
            <div>
              <span className="metric-label">Выручка</span>
              <span className="metric-value">{formatMoney(product.revenue)}</span>
            </div>
          </div>

          {product.isDiscounted && <p>🏷️ Товар со скидкой</p>}
          {product.archived && <p>📦 Архивный товар</p>}
        </div>
      </div>

      <section className="product-details-section">
        <h2>Продажи за 30 дней</h2>

        <div className="sales-chart">
          {product.salesChart.map((point) => (
            <div key={point.date} className="sales-chart-column">
              <div
                className="sales-chart-bar"
                style={{
                  height: `${Math.round((point.revenue / maxChartRevenue) * 100)}%`,
                }}
                title={`${point.date}: ${point.orders} зак., ${formatMoney(point.revenue)}`}
              />
              <span className="sales-chart-label">
                {point.date.slice(8, 10)}
              </span>
            </div>
          ))}
        </div>

        <p className="chart-hint">
          По дням: количество заказов и выручка (наведите на столбец)
        </p>
      </section>

      <section className="product-details-section">
        <h2>Остатки</h2>

        <div className="stock-info-grid">
          <div className="stock-info-card">
            <span className="metric-label">Текущий остаток</span>
            <span className="metric-value">{product.stockInfo.current} шт.</span>
          </div>
          <div className="stock-info-card">
            <span className="metric-label">Средние продажи</span>
            <span className="metric-value">
              {product.stockInfo.averageSalesPerDay} шт./день
            </span>
          </div>
          <div className="stock-info-card">
            <span className="metric-label">Примерный запас</span>
            <span className="metric-value">
              {product.stockInfo.estimatedDays === null
                ? "—"
                : `${product.stockInfo.estimatedDays} дней`}
            </span>
          </div>
        </div>

        <div className={`stock-analysis stock-analysis--${product.stockInfo.status}`}>
          <span className="stock-analysis-status">
            {STOCK_STATUS_LABELS[product.stockInfo.status]}
          </span>
          {product.stockInfo.warning && (
            <p className="stock-analysis-warning">{product.stockInfo.warning}</p>
          )}
        </div>
      </section>
    </main>
  );
}

export default ProductDetails;


