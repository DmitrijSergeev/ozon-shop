import { z } from "zod";

export const createShopSchema = z.object({
  name: z.string().min(1).max(255),
});

export const connectOzonSchema = z.object({
  clientId: z.string().min(1),
  apiKey: z.string().min(1),
});

export type CreateShopDto = z.infer<typeof createShopSchema>;
export type ConnectOzonDto = z.infer<typeof connectOzonSchema>;
