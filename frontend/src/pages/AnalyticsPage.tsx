import { useEffect, useState } from "react";
import {
  getAnalytics,
  type AnalyticsPeriod,
  type AnalyticsResult,
  type DayPoint,
} from "../api/analytics.js";
import { useShop } from "../hooks/useShop.js";
import ShopSelector from "../components/ShopSelector.js";
import "./analytics.css";

const PERIOD_LABELS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "today", label: "Сегодня" },
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "custom", label: "Произвольный период" },
];

function formatMoney(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

/** Простой SVG-график (столбцы) */
function BarChart({
  data,
  valueKey,
  color,
  formatValue,
}: {
  data: DayPoint[];
  valueKey: "revenue" | "orders";
  color: string;
  formatValue: (v: number) => string;
}) {
  const width = 720;
  const height = 220;
  const padding = 40;

  const values = data.map((d) => d[valueKey]);
  const max = Math.max(...values, 1);

  const barWidth = Math.max(
    4,
    Math.min(40, (width - padding * 2) / data.length - 6),
  );
  const step = (width - padding * 2) / data.length;

  return (
    <svg
      className="analytics-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="График"
    >
      {data.map((d, i) => {
        const h = (d[valueKey] / max) * (height - padding * 2);
        const x = padding + i * step + (step - barWidth) / 2;
        const y = height - padding - h;

        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={h}
              fill={color}
              rx={2}
            >
              <title>
                {formatShortDate(d.date)}: {formatValue(d[valueKey])}
              </title>
            </rect>
            {data.length <= 31 && (
              <text
                x={x + barWidth / 2}
                y={height - padding + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {formatShortDate(d.date)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function AnalyticsPage() {
  const { shopId } = useShop();
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shopId) return;

    setLoading(true);
    setError("");

    getAnalytics(shopId, {
      period,
      dateFrom: period === "custom" ? dateFrom : null,
      dateTo: period === "custom" ? dateTo : null,
    })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, [shopId, period, dateFrom, dateTo]);

  if (loading && !data) {
    return (
      <main className="analytics-page">
        <p>Загрузка аналитики...</p>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="analytics-page">
        <p className="auth-error">{error}</p>
      </main>
    );
  }

  return (
    <main className="analytics-page">
      <div className="page-header">
        <h1>Аналитика</h1>
        <ShopSelector />
      </div>

      <div className="analytics-controls">
        <div className="analytics-periods">
          {PERIOD_LABELS.map((p) => (
            <button
              key={p.value}
              className={`period-btn ${period === p.value ? "active" : ""}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <div className="analytics-custom">
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
          </div>
        )}
      </div>

      {data && (
        <>
          <section className="analytics-section">
            <h2>Выручка</h2>
            <BarChart
              data={data.revenue}
              valueKey="revenue"
              color="#1a56db"
              formatValue={formatMoney}
            />
          </section>

          <section className="analytics-section">
            <h2>Заказы</h2>
            <BarChart
              data={data.orders}
              valueKey="orders"
              color="#7c3aed"
              formatValue={(v) => `${v} зак.`}
            />
          </section>

          <section className="analytics-section">
            <h2>Продажи товаров (ТОП-10)</h2>
            <div className="analytics-table-wrap">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th className="num">Продано</th>
                    <th className="num">Выручка</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="analytics-product-name">{p.name}</div>
                        <div className="analytics-product-offer">
                          {p.offerId}
                        </div>
                      </td>
                      <td className="num">{p.sold} шт.</td>
                      <td className="num">{formatMoney(p.revenue)}</td>
                    </tr>
                  ))}
                  {data.topProducts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="analytics-empty">
                        Нет продаж за выбранный период.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="analytics-section">
            <h2>Плохие товары</h2>
            <div className="analytics-nosales">
              <div className="analytics-nosales-title">Товары без продаж</div>
              <p>
                За последние {data.noSales.days}{" "}
                {pluralDays(data.noSales.days)}{" "}
                <strong>{data.noSales.count}</strong>{" "}
                {pluralProducts(data.noSales.count)} не получили ни одного
                заказа.
              </p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

function pluralProducts(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "товар";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "товара";
  return "товаров";
}

export default AnalyticsPage;
