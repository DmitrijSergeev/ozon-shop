import { prisma } from "../lib/prisma.js";

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

export const NOTIFICATION_TYPES: {
  type: NotificationType;
  label: string;
}[] = [
  { type: "out_of_stock", label: "Товар закончился" },
  { type: "stock_low_3d", label: "Остатка хватит менее чем на 3 дня" },
  { type: "stock_low_7d", label: "Остатка хватит менее чем на 7 дней" },
  { type: "sales_drop", label: "Продажи товара резко упали" },
  { type: "new_order", label: "Получен новый заказ" },
];

export async function getNotificationSettings(
  userId: string,
): Promise<NotificationSettingItem[]> {
  const settings = await prisma.notificationSetting.findMany({
    where: { userId },
  });

  const byType = new Map(settings.map((s) => [s.type, s.enabled]));

  return NOTIFICATION_TYPES.map(({ type, label }) => ({
    type,
    label,
    enabled: byType.get(type) ?? true,
  }));
}

export async function updateNotificationSettings(
  userId: string,
  updates: { type: NotificationType; enabled: boolean }[],
): Promise<NotificationSettingItem[]> {
  for (const { type, enabled } of updates) {
    await prisma.notificationSetting.upsert({
      where: { userId_type: { userId, type } },
      create: { userId, type, enabled },
      update: { enabled },
    });
  }

  return getNotificationSettings(userId);
}
