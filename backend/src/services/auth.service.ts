import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signToken } from "../lib/jwt.js";
import { ConflictError } from "../errors/ConflictError.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";

export async function register(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new ConflictError("Пользователь с таким email уже существует");
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashPassword(password),
    },
  });

  return { token: signToken({ userId: user.id }), user: toPublicUser(user) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new UnauthorizedError("Неверный email или пароль");
  }

  return { token: signToken({ userId: user.id }), user: toPublicUser(user) };
}

function toPublicUser(user: { id: string; email: string }) {
  return { id: user.id, email: user.email };
}
