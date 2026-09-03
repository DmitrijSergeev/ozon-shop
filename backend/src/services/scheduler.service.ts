import { prisma } from "../lib/prisma.js";
import { syncShop, type SyncType } from "./sync.service.js";

const FREQUENT_INTERVAL_MS = 10 * 60 * 1000; // 10 минут
const INFREQUENT_INTERVAL_MS = 60 * 60 * 1000; // 1 час

let started = false;

/**
 * Запускает фоновый планировщик синхронизации.
 *
 * - Частые данные (заказы + остатки) — каждые 10 минут.
 * - Менее частые (товары + цены) — каждый час.
 */
export function startScheduler(): void {
  if (started) return;
  started = true;

  // Первый запуск — сразу после старта сервера (с небольшой задержкой)
  setTimeout(() => runAll("frequent"), 5_000);
  setTimeout(() => runAll("infrequent"), 15_000);

  setInterval(() => runAll("frequent"), FREQUENT_INTERVAL_MS);
  setInterval(() => runAll("infrequent"), INFREQUENT_INTERVAL_MS);

  console.log("⏰ Scheduler started (frequent: 10m, infrequent: 1h)");
}

async function runAll(type: SyncType): Promise<void> {
  // Все подключённые магазины
  const connections = await prisma.ozonConnection.findMany({
    where: { status: "connected" },
    select: { shopId: true },
  });

  for (const { shopId } of connections) {
    try {
      await syncShop(shopId, type);
      console.log(`✅ Sync (${type}) ok for shop ${shopId}`);
    } catch (err: any) {
      console.error(`❌ Sync (${type}) failed for shop ${shopId}:`, err?.message ?? err);
    }
  }
}
