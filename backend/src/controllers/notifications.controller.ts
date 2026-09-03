import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../services/notifications.service.js";
import { updateNotificationsSchema } from "../schemas/notifications.schema.js";

/**
 * GET /api/notifications/settings
 *
 * Текущие настройки уведомлений пользователя.
 */
export const getNotificationSettingsHandler = asyncHandler(async (req, res) => {
  const settings = await getNotificationSettings(req.userId!);
  res.json({ settings });
});

/**
 * PUT /api/notifications/settings
 *
 * Обновить настройки уведомлений.
 */
export const updateNotificationSettingsHandler = asyncHandler(
  async (req, res) => {
    const input = updateNotificationsSchema.parse(req.body);

    const settings = await updateNotificationSettings(
      req.userId!,
      input.settings,
    );

    res.json({ settings });
  },
);
