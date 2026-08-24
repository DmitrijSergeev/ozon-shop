import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listShops,
  getDashboard,
  getAttention,
  type Shop,
  type DashboardMetrics,
  type AttentionItem,
} from "../api/shop.js";

const SEVERITY_LABELS: Record<string, string> = {
  red: "🔴",
  orange: "🟠",
  yellow: "🟡",
  blue: "🔵",
  purple: "🟣",
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function DashboardPage() {
  const navigate = useNavigate();

  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [attention, setAttention] = useState<AttentionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listShops()
      .then((data) => {
        setShops(data);
        if (data.length > 0) {
          setSelectedShopId(data[0].id);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedShopId) return;

    setLoading(true);
    setError("");

    Promise.all([getDashboard(selectedShopId), getAttention(selectedShopId)])
      .then(([dashboard, attentionData]) => {
        setMetrics(dashboard.metrics);
        setAttention(attentionData.items);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, [selectedShopId]);

  if (loading && !metrics) {
    return (
      <main className="dashboard-page">
        <p>Загрузка...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="dashboard-page">
        <p className="auth-error">{error}</p>
      </main>
    );
  }

  if (shops.length === 0) {
    return (
      <main className="dashboard-page">
        <h1>Dashboard</h1>
        <p>У вас пока нет магазинов.</p>
        <button type="button" onClick={() => navigate("/settings")}>
          Создать магазин
        </button>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <select
          value={selectedShopId}
          onChange={(e) => setSelectedShopId(e.target.value)}
        >
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>
      </div>

      {metrics && (
        <section className="metrics-grid">
          <div className="metric-card">
            <span className="metric-label">Выручка сегодня</span>
            <span className="metric-value">{formatMoney(metrics.todayRevenue)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Выручка за 7 дней</span>
            <span className="metric-value">{formatMoney(metrics.weekRevenue)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Заказов сегодня</span>
            <span className="metric-value">{metrics.todayOrderCount}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Средний чек</span>
            <span className="metric-value">{formatMoney(metrics.averageCheck)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Товаров</span>
            <span className="metric-value">{metrics.productCount}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Без остатка</span>
            <span className="metric-value">{metrics.outOfStockCount}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Низкий остаток</span>
            <span className="metric-value">{metrics.lowStockCount}</span>
          </div>
        </section>
      )}

      <section className="attention-section">
        <h2>Требует внимания</h2>

        {attention.length === 0 ? (
          <p>Всё в порядке</p>
        ) : (
          <ul className="attention-list">
            {attention.map((item) => (
              <li key={item.id} className="attention-item">
                <button type="button" onClick={() => navigate("/products")}>
                  <span className="attention-severity">{SEVERITY_LABELS[item.severity]}</span>
                  <span>
                    {item.count} {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default DashboardPage;
