import { useEffect, useState } from "react";
import {
  listShops,
  createShop,
  connectOzon,
  syncShop,
  type Shop,
} from "../api/shop.js";

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает подключения",
  connected: "Подключено",
  auth_error: "Ошибка авторизации",
  api_unavailable: "API недоступен",
  reconnect_required: "Требуется переподключение",
};

function SettingsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [newShopName, setNewShopName] = useState("");
  const [clientId, setClientId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [selectedShopId, setSelectedShopId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function reload() {
    const data = await listShops();
    setShops(data);
    if (data.length > 0 && !selectedShopId) {
      setSelectedShopId(data[0].id);
    }
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof Error ? err.message : "Ошибка"));
  }, []);

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

          <button type="button" onClick={handleSync} disabled={loading}>
            Синхронизировать данные
          </button>
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
