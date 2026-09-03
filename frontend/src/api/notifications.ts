import { apiFetch } from "./client";

export type NotificationType =
  | "out_of_stock"
  | "stock_low_3d"
  | "stock_low_7d"
  | "sales_drop"
  | "new_order";

export interface NotificationSettingItem {
  type: NotificationType;
  label: string;
  enabled: boolean;
}

export async function getNotificationSettings(): Promise<{
  settings: NotificationSettingItem[];
}> {
  return apiFetch<{ settings: NotificationSettingItem[] }>(
    "/api/notifications/settings",
  );
}

export async function updateNotificationSettings(
  settings: { type: NotificationType; enabled: boolean }[],
): Promise<{ settings: NotificationSettingItem[] }> {
  return apiFetch<{ settings: NotificationSettingItem[] }>(
    "/api/notifications/settings",
    {
      method: "PUT",
      body: JSON.stringify({ settings }),
    },
  );
}
