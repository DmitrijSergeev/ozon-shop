import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Force-load .env with override so a system-level DATABASE_URL (e.g. Railway)
// can never shadow the local database configured in backend/.env.
loadEnv({ path: ".env", override: true });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });
