import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_SECRET: z.string().min(16).default("dev-secret-change-me-please-123456"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  ENCRYPTION_KEY: z.string().min(32).default("dev-encryption-key-change-me-32bytes!"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;
