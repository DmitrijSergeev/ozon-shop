import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "out_of_stock",
  "stock_low_3d",
  "stock_low_7d",
  "sales_drop",
  "new_order",
]);

export const updateNotificationsSchema = z.object({
  settings: z
    .array(
      z.object({
        type: notificationTypeSchema,
        enabled: z.boolean(),
      }),
    )
    .min(1),
});

export type UpdateNotificationsInput = z.infer<
  typeof updateNotificationsSchema
>;
