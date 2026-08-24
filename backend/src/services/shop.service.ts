import { prisma } from "../lib/prisma.js";
import { encryptSecret, decryptSecret } from "../lib/crypto.js";
import { createOzonClient } from "./ozonClient.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ForbiddenError } from "../errors/ForbiddenError.js";

export async function createShop(userId: string, name: string) {
  return prisma.shop.create({
    data: { userId, name },
  });
}

export async function listShops(userId: string) {
  return prisma.shop.findMany({
    where: { userId },
    include: { connections: { select: { status: true, lastChecked: true } } },
  });
}

export async function getShopForUser(userId: string, shopId: string) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });

  if (!shop) {
    throw new NotFoundError("Магазин не найден");
  }

  if (shop.userId !== userId) {
    throw new ForbiddenError("Нет доступа к этому магазину");
  }

  return shop;
}

export async function connectOzon(userId: string, shopId: string, clientId: string, apiKey: string) {
  await getShopForUser(userId, shopId);

  // Проверяем соединение до сохранения
  const client = createOzonClient({ clientId, apiKey });

  let status = "connected";

  try {
    await client.post("/v3/product/list", { filter: { visibility: "ALL" }, limit: 1 });
  } catch (err: any) {
    const code = err?.response?.status;
    if (code === 401 || code === 403) {
      status = "auth_error";
    } else {
      status = "api_unavailable";
    }
  }

  const connection = await prisma.ozonConnection.upsert({
    where: { shopId },
    create: {
      shopId,
      clientId,
      apiKeyCipher: encryptSecret(apiKey),
      status,
      lastChecked: new Date(),
    },
    update: {
      clientId,
      apiKeyCipher: encryptSecret(apiKey),
      status,
      lastChecked: new Date(),
    },
  });

  return { status: connection.status };
}

export async function getOzonCredentials(shopId: string): Promise<{ clientId: string; apiKey: string }> {
  const connection = await prisma.ozonConnection.findUnique({ where: { shopId } });

  if (!connection) {
    throw new NotFoundError("Магазин не подключён к Ozon");
  }

  return {
    clientId: connection.clientId,
    apiKey: decryptSecret(connection.apiKeyCipher),
  };
}
