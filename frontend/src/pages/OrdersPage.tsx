import { useEffect, useState } from "react";
import {
  getOrders,
  getOrderStatuses,
  type OrderRow,
} from "../api/orders.js";
import { getProducts } from "../api/products.js";
import { useShop } from "../hooks/useShop.js";
import ShopSelector from "../components/ShopSelector.js";
import "./orders.css";

function formatMoney(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrdersPage() {
  const { shopId } = useShop();
  const [items, setItems] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Фильтры
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");
  const [productId, setProductId] = useState("");

  // Справочники для фильтров
  const [statuses, setStatuses] = useState<string[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string | null; offerId: string }[]>([]);

  // Загружаем справочники статусов и товаров
  useEffect(() => {
    if (!shopId) return;

    getOrderStatuses(shopId)
      .then((res) => setStatuses(res.statuses))
      .catch(() => {});

    getProducts(shopId, { limit: 100, offset: 0 })
      .then((page) =>
        setProducts(
          page.items.map((p) => ({
            id: p.id,
            name: p.name,
            offerId: p.offerId,
          })),
        ),
      )
      .catch(() => {});
  }, [shopId]);

  // Загружаем заказы при изменении фильтров
  useEffect(() => {
    if (!shopId) return;

    setLoading(true);
    setError("");

    getOrders(shopId, {
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      status: status || null,
      productId: productId || null,
    })
      .then((page) => setItems(page.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, [shopId, dateFrom, dateTo, status, productId]);

  if (loading && items.length === 0) {
    return (
      <main className="orders-page">
        <p>Загрузка заказов...</p>
      </main>
    );
  }

  if (error && items.length === 0) {
    return (
      <main className="orders-page">
        <p className="auth-error">{error}</p>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <div className="page-header">
        <h1>Заказы</h1>
        <ShopSelector />
      </div>

      <div className="orders-filters">
        <label>
          С даты
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </label>

        <label>
          По дату
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </label>

        <label>
          Статус
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Все статусы</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label>
          Товар
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">Все товары</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.offerId}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Заказ</th>
              <th>Дата</th>
              <th>Товары</th>
              <th className="num">Сумма</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {items.map((order) => (
              <tr key={order.id}>
                <td>
                  <div className="orders-id">
                    {order.postingNumber || order.ozonOrderId}
                  </div>
                  <span className={`order-scheme order-scheme-${order.scheme}`}>
                    {order.scheme.toUpperCase()}
                  </span>
                </td>
                <td>{formatDate(order.createdAt)}</td>
                <td>
                  <div className="orders-products">
                    {order.products.length === 0 ? (
                      <span className="orders-no-products">—</span>
                    ) : (
                      order.products.map((p, i) => (
                        <div key={i} className="orders-product-line">
                          {p.name} × {p.quantity}
                        </div>
                      ))
                    )}
                  </div>
                </td>
                <td className="num">{formatMoney(order.amount)}</td>
                <td>
                  <span className="order-status">{order.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <p className="orders-empty">Нет заказов, соответствующих фильтрам.</p>
      )}
    </main>
  );
}

export default OrdersPage;
