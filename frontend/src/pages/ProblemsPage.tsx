"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getProblems,
  resolveProblem,
  type ProblemItem,
  type ProblemsPage,
} from "../api/problems";
import { useShop } from "../hooks/useShop";
import ShopSelector from "../components/ShopSelector";

const SEVERITY_ICON: Record<string, string> = {
  critical: "🔴",
  important: "🟠",
  info: "🟡",
};

function ProblemCard({
  item,
  onResolve,
  onOpen,
}: {
  item: ProblemItem;
  onResolve: () => void;
  onOpen: () => void;
}) {
  return (
    <div className={`problem-card problem-${item.severity}`}>
      <div className="problem-icon">{SEVERITY_ICON[item.severity]}</div>
      <div className="problem-body">
        <div className="problem-message">{item.message}</div>
        <div className="problem-product">
          {item.productName}
          {item.offerId && (
            <span className="problem-offer"> · {item.offerId}</span>
          )}
        </div>
      </div>
      <div className="problem-actions">
        <button className="problem-open" onClick={onOpen}>
          Открыть
        </button>
        <button className="problem-resolve" onClick={onResolve}>
          Решено
        </button>
      </div>
    </div>
  );
}

function ProblemsPage() {
  const router = useRouter();
  const { shopId } = useShop();
  const [data, setData] = useState<ProblemsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    if (!shopId) return;
    setLoading(true);
    setError("");
    getProblems(shopId)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const handleResolve = async (item: ProblemItem) => {
    try {
      await resolveProblem(shopId, item.productId, item.type);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  };

  if (loading && !data) {
    return (
      <main className="problems-page">
        <p>Загрузка проблем...</p>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="problems-page">
        <p className="auth-error">{error}</p>
      </main>
    );
  }

  const total = data?.total ?? 0;

  return (
    <main className="problems-page">
      <div className="page-header">
        <h1>Центр проблем</h1>
        <ShopSelector />
      </div>

      {total === 0 && (
        <div className="problems-empty">
          🎉 Проблем не обнаружено. Все товары в порядке.
        </div>
      )}

      {data && data.critical.length > 0 && (
        <section className="problems-section">
          <h2 className="problems-critical-title">
            Критические ({data.critical.length})
          </h2>
          {data.critical.map((item) => (
            <ProblemCard
              key={`${item.productId}:${item.type}`}
              item={item}
              onResolve={() => handleResolve(item)}
              onOpen={() => router.push(`/products/${item.productId}`)}
            />
          ))}
        </section>
      )}

      {data && data.important.length > 0 && (
        <section className="problems-section">
          <h2 className="problems-important-title">
            Важные ({data.important.length})
          </h2>
          {data.important.map((item) => (
            <ProblemCard
              key={`${item.productId}:${item.type}`}
              item={item}
              onResolve={() => handleResolve(item)}
              onOpen={() => router.push(`/products/${item.productId}`)}
            />
          ))}
        </section>
      )}

      {data && data.info.length > 0 && (
        <section className="problems-section">
          <h2 className="problems-info-title">
            Информационные ({data.info.length})
          </h2>
          {data.info.map((item) => (
            <ProblemCard
              key={`${item.productId}:${item.type}`}
              item={item}
              onResolve={() => handleResolve(item)}
              onOpen={() => router.push(`/products/${item.productId}`)}
            />
          ))}
        </section>
      )}
    </main>
  );
}

export default ProblemsPage;
