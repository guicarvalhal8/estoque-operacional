import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { createHttpError } from "../lib/http-error.js";
import { serializeUser } from "../utils/serializers.js";

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !user.isActive) {
    throw createHttpError(401, "Credenciais invalidas");
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);

  if (!validPassword) {
    throw createHttpError(401, "Credenciais invalidas");
  }

  return serializeUser(user);
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw createHttpError(404, "Usuario nao encontrado");
  }

  return serializeUser(user);
}

