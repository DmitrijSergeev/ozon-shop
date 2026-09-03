"use client";

import { useEffect, useState } from "react";
import { getStocks, type StockRow, type StockStatus } from "../api/stocks";
import { useShop } from "../hooks/useShop";
import ShopSelector from "../components/ShopSelector";

const STATUS_LABELS: Record<StockStatus, string> = {
  green: "🟢",
  yellow: "🟡",
  orange: "🟠",
  red: "🔴",
  unknown: "⚪",
};

const STATUS_TEXT: Record<StockStatus, string> = {
  green: "Более 14 дней",
  yellow: "7–14 дней",
  orange: "3–7 дней",
  red: "Менее 3 дней",
  unknown: "Нет данных",
};

function formatDays(days: number | null, stock: number): string {
  if (stock <= 0) return "0 дней";
  if (days === null) return "—";
  if (days < 1) return "<1 дня";
  return `${days} дн.`;
}

function StocksPage() {
  const { shopId } = useShop();
  const [items, setItems] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [withinDays, setWithinDays] = useState<number | null>(null);

  useEffect(() => {
    if (!shopId) return;

    setLoading(true);
    setError("");

    getStocks(shopId, withinDays)
      .then((page) => setItems(page.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, [shopId, withinDays]);

  if (loading) {
    return (
      <main className="stocks-page">
        <p>Загрузка остатков...</p>
      </main>
    );
  }

  if (error && items.length === 0) {
    return (
      <main className="stocks-page">
        <p className="auth-error">{error}</p>
      </main>
    );
  }

  return (
    <main className="stocks-page">
      <div className="page-header">
        <h1>Остатки</h1>
        <ShopSelector />
      </div>

      <div className="stocks-filter">
        <label>
          Показать товары, которые закончатся в течение:
          <select
            value={withinDays ?? ""}
            onChange={(e) =>
              setWithinDays(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Все товары</option>
            <option value="3">3 дней</option>
            <option value="7">7 дней</option>
            <option value="14">14 дней</option>
            <option value="30">30 дней</option>
          </select>
        </label>
      </div>

      <div className="stocks-table-wrap">
        <table className="stocks-table">
          <thead>
            <tr>
              <th>Товар</th>
              <th className="num">Остаток</th>
              <th className="num">Продажи/день</th>
              <th className="num">Хватит</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="stocks-product-name">
                    {item.name || item.offerId}
                  </div>
                  <div className="stocks-product-offer">{item.offerId}</div>
                </td>
                <td className="num">{item.stock} шт.</td>
                <td className="num">{item.salesPerDay} шт./день</td>
                <td className="num">
                  {formatDays(item.estimatedDays, item.stock)}
                </td>
                <td>
                  <span className={`stock-badge stock-${item.status}`}>
                    {STATUS_LABELS[item.status]} {STATUS_TEXT[item.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <p className="stocks-empty">Нет товаров, соответствующих фильтру.</p>
      )}
    </main>
  );
}

export default StocksPage;
