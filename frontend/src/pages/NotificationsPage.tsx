"use client";

import { useEffect, useState } from "react";
import {
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationSettingItem,
} from "../api/notifications";

function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getNotificationSettings()
      .then((data) => setSettings(data.settings))
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (type: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.type === type ? { ...s, enabled: !s.enabled } : s)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const data = await updateNotificationSettings(
        settings.map((s) => ({ type: s.type, enabled: s.enabled })),
      );
      setSettings(data.settings);
      setMessage("Настройки сохранены");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="notifications-page">
        <p>Загрузка настроек...</p>
      </main>
    );
  }

  return (
    <main className="notifications-page">
      <h1>Уведомления</h1>

      <p className="notifications-hint">
        Выберите события, о которых хотите получать уведомления внутри
        приложения.
      </p>

      <div className="notifications-list">
        {settings.map((s) => (
          <label key={s.type} className="notification-item">
            <input
              type="checkbox"
              checked={s.enabled}
              onChange={() => toggle(s.type)}
            />
            <span className="notification-label">{s.label}</span>
          </label>
        ))}
      </div>

      <div className="notifications-actions">
        <button
          className="notifications-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>

      <div className="notifications-future">
        <h2>Скоро</h2>
        <p>
          В будущих версиях уведомления можно будет получать в Telegram и на
          email.
        </p>
      </div>

      {message && <p className="settings-message">{message}</p>}
      {error && <p className="auth-error">{error}</p>}
    </main>
  );
}

export default NotificationsPage;
