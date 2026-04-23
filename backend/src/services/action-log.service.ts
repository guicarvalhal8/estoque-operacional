import type { Prisma, PrismaClient } from "@prisma/client";

type PrismaOrTransaction = PrismaClient | Prisma.TransactionClient;

export async function logAction(
  db: PrismaOrTransaction,
  input: {
    userId?: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: unknown;
  }
) {
  await db.actionLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      details: input.details === undefined ? null : JSON.stringify(input.details)
    }
  });
}
