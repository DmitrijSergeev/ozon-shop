import "dotenv/config";
import { app } from "./app.js";
import { startScheduler } from "./services/scheduler.service.js";

const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, () => {
  console.log(`🚀 Server started on http://localhost:${port}`);
});

// Запускаем фоновую периодическую синхронизацию
startScheduler();

function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down...`);

  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
