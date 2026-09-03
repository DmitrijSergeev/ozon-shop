"use client";

import { useEffect, useState } from "react";
import {
  listShops,
  createShop,
  connectOzon,
  syncShop,
  getLastSync,
  type Shop,
} from "../api/shop";

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает подключения",
  connected: "Подключено",
  auth_error: "Ошибка авторизации",
  api_unavailable: "API недоступен",
  reconnect_required: "Требуется переподключение",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SettingsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [newShopName, setNewShopName] = useState("");
  const [clientId, setClientId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [selectedShopId, setSelectedShopId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  async function reload() {
    const data = await listShops();
    setShops(data);
    if (data.length > 0 && !selectedShopId) {
      setSelectedShopId(data[0].id);
    }
  }

  async function reloadLastSync(shopId: string) {
    if (!shopId) return;
    try {
      const { last } = await getLastSync(shopId);
      setLastSync(last ? formatTime(last.finishedAt) : null);
    } catch {
      setLastSync(null);
    }
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof Error ? err.message : "Ошибка"));
  }, []);

  useEffect(() => {
    reloadLastSync(selectedShopId);
  }, [selectedShopId]);

  async function handleCreateShop(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const shop = await createShop(newShopName);
      setNewShopName("");
      setSelectedShopId(shop.id);
      await reload();
      setMessage("Магазин создан");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  async function handleConnect(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await connectOzon(selectedShopId, clientId, apiKey);
      setMessage(`Статус подключения: ${STATUS_LABELS[result.status] ?? result.status}`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setError("");
    setMessage("");
    setLoading(true);

    if (!selectedShopId) {
      setError("Сначала выберите магазин");
      setLoading(false);
      return;
    }

    try {
      await syncShop(selectedShopId);
      setMessage("Синхронизация завершена");
      await reloadLastSync(selectedShopId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="settings-page">
      <h1>Настройки магазина</h1>

      <section>
        <h2>Создать магазин</h2>
        <form onSubmit={handleCreateShop}>
          <input
            type="text"
            value={newShopName}
            onChange={(e) => setNewShopName(e.target.value)}
            placeholder="Название магазина"
            required
          />
          <button type="submit">Создать</button>
        </form>
      </section>

      {shops.length > 0 && (
        <section>
          <h2>Подключение Ozon</h2>

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

          <form onSubmit={handleConnect}>
            <label>
              Client ID
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              />
            </label>

            <label>
              API Key
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </label>

            <button type="submit" disabled={loading}>
              Подключить
            </button>
          </form>

          <div className="sync-controls">
            <p className="last-sync">
              {lastSync
                ? `Последняя синхронизация: ${lastSync}`
                : "Синхронизация ещё не выполнялась"}
            </p>
            <button type="button" onClick={handleSync} disabled={loading}>
              Обновить сейчас
            </button>
          </div>
        </section>
      )}

      {shops.length > 0 && (
        <section>
          <h2>Мои магазины</h2>
          <ul>
            {shops.map((shop) => {
              const status = shop.connections[0]?.status ?? "pending";
              return (
                <li key={shop.id}>
                  <strong>{shop.name}</strong>
                  <span> — {STATUS_LABELS[status] ?? status}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {message && <p className="settings-message">{message}</p>}
      {error && <p className="auth-error">{error}</p>}
    </main>
  );
}

export default SettingsPage;
