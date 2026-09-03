"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getPrices,
  updatePrices,
  type PriceRow,
} from "../api/prices";
import { useShop } from "../hooks/useShop";
import ShopSelector from "../components/ShopSelector";

function formatMoney(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

type BulkAction = "plus5" | "plus10" | "minus5" | "minus10" | "fixed";

function PricesPage() {
  const { shopId } = useShop();
  const [items, setItems] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Редактируемые цены: productId -> новая цена (строка для ввода)
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  // Выбранные товары для массовых действий
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Массовое действие
  const [bulkAction, setBulkAction] = useState<BulkAction>("plus5");
  const [fixedPrice, setFixedPrice] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shopId) return;

    setLoading(true);
    setError("");

    getPrices(shopId)
      .then((page) => setItems(page.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, [shopId]);

  function setDraft(productId: string, value: string) {
    setDrafts((prev) => ({ ...prev, [productId]: value }));
  }

  function toggleSelect(productId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      if (prev.size === items.length) {
        return new Set();
      }
      return new Set(items.map((i) => i.id));
    });
  }

  // Собрать изменения: только те товары, где введена новая цена
  const pendingUpdates = useMemo(() => {
    const updates: { productId: string; price: number }[] = [];

    for (const item of items) {
      const draft = drafts[item.id];
      if (draft === undefined || draft === "") continue;

      const price = Number(draft);
      if (Number.isNaN(price) || price <= 0) continue;

      updates.push({ productId: item.id, price });
    }

    return updates;
  }, [items, drafts]);

  async function handleSave() {
    if (pendingUpdates.length === 0) {
      setMessage("Нет изменений для сохранения");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await updatePrices(shopId, pendingUpdates);

      if (result.failed > 0) {
        setError(
          `Обновлено: ${result.updated}, ошибок: ${result.failed}. ` +
            result.errors.map((e) => `${e.productId}: ${e.message}`).join("; "),
        );
      } else {
        setMessage(`Цены обновлены: ${result.updated} товар(ов)`);
      }

      // Сбросить черновики и перезагрузить
      setDrafts({});
      const page = await getPrices(shopId);
      setItems(page.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  function applyBulkAction() {
    if (selected.size === 0) {
      setMessage("Выберите товары для массового действия");
      return;
    }

    const nextDrafts = { ...drafts };

    for (const item of items) {
      if (!selected.has(item.id)) continue;
      if (item.price === null) continue;

      let newPrice: number;

      switch (bulkAction) {
        case "plus5":
          newPrice = Math.round(item.price * 1.05);
          break;
        case "plus10":
          newPrice = Math.round(item.price * 1.1);
          break;
        case "minus5":
          newPrice = Math.round(item.price * 0.95);
          break;
        case "minus10":
          newPrice = Math.round(item.price * 0.9);
          break;
        case "fixed":
          newPrice = Number(fixedPrice);
          if (Number.isNaN(newPrice) || newPrice <= 0) {
            setError("Введите корректную фиксированную цену");
            return;
          }
          break;
      }

      nextDrafts[item.id] = String(newPrice);
    }

    setDrafts(nextDrafts);
    setMessage(`Применено к ${selected.size} товар(ам). Нажмите «Сохранить».`);
  }

  if (loading) {
    return (
      <main className="prices-page">
        <p>Загрузка цен...</p>
      </main>
    );
  }

  if (error && items.length === 0) {
    return (
      <main className="prices-page">
        <p className="auth-error">{error}</p>
      </main>
    );
  }

  return (
    <main className="prices-page">
      <div className="page-header">
        <h1>Управление ценами</h1>
        <ShopSelector />
      </div>

      <div className="prices-toolbar">
        <div className="bulk-actions">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as BulkAction)}
          >
            <option value="plus5">+5%</option>
            <option value="plus10">+10%</option>
            <option value="minus5">-5%</option>
            <option value="minus10">-10%</option>
            <option value="fixed">Фиксированная цена</option>
          </select>

          {bulkAction === "fixed" && (
            <input
              type="number"
              min="1"
              value={fixedPrice}
              onChange={(e) => setFixedPrice(e.target.value)}
              placeholder="Цена, ₽"
            />
          )}

          <button type="button" onClick={applyBulkAction}>
            Изменить цену ({selected.size})
          </button>
        </div>

        <button
          type="button"
          className="prices-save"
          onClick={handleSave}
          disabled={saving || pendingUpdates.length === 0}
        >
          {saving ? "Сохранение..." : `Сохранить (${pendingUpdates.length})`}
        </button>
      </div>

      {message && <p className="settings-message">{message}</p>}
      {error && <p className="auth-error">{error}</p>}

      <div className="prices-table-wrap">
        <table className="prices-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selected.size === items.length && items.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Товар</th>
              <th className="num">Текущая цена</th>
              <th className="num">Новая цена</th>
              <th className="num">Изменение</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const draft = drafts[item.id];
              const newPrice = draft !== undefined && draft !== "" ? Number(draft) : null;
              const hasChange =
                newPrice !== null &&
                !Number.isNaN(newPrice) &&
                item.price !== null &&
                newPrice !== item.price;

              const diff =
                hasChange && item.price !== null
                  ? newPrice! - item.price
                  : null;

              return (
                <tr key={item.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  <td>
                    <div className="prices-product-name">
                      {item.name || item.offerId}
                    </div>
                    <div className="prices-product-offer">{item.offerId}</div>
                  </td>
                  <td className="num">{formatMoney(item.price)}</td>
                  <td className="num">
                    <input
                      type="number"
                      min="1"
                      className="price-input"
                      value={draft ?? ""}
                      placeholder={item.price !== null ? String(item.price) : ""}
                      onChange={(e) => setDraft(item.id, e.target.value)}
                    />
                  </td>
                  <td className="num">
                    {diff === null ? (
                      <span className="price-diff-empty">—</span>
                    ) : diff > 0 ? (
                      <span className="price-diff-up">+{formatMoney(diff)}</span>
                    ) : diff < 0 ? (
                      <span className="price-diff-down">{formatMoney(diff)}</span>
                    ) : (
                      <span className="price-diff-empty">0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default PricesPage;
