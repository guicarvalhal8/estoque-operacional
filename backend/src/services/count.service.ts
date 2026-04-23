import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "../lib/prisma.js";
import { createHttpError } from "../lib/http-error.js";
import { getProductStatus } from "../utils/product-status.js";
import { toDecimal, toNumber } from "../utils/decimal.js";
import { logAction } from "./action-log.service.js";

function serializeCountSession(
  session: {
    id: string;
    title: string;
    status: string;
    referenceDate: Date;
    notes: string | null;
    startedAt: Date;
    closedAt: Date | null;
    createdBy: { id: string; name: string };
    closedBy?: { id: string; name: string } | null;
    items?: Array<{
      id: string;
      systemQuantity: number;
      countedQuantity: number | null;
      difference: number | null;
      note: string | null;
      product: {
        id: string;
        name: string;
        unit: string;
        currentQuantity: number;
        minimumStock: number;
        category: { id: string; name: string };
      };
    }>;
  }
) {
  const items = session.items?.map((item) => ({
    id: item.id,
    productId: item.product.id,
    productName: item.product.name,
    categoryName: item.product.category.name,
    unit: item.product.unit,
    systemQuantity: toNumber(item.systemQuantity),
    countedQuantity:
      item.countedQuantity === null || item.countedQuantity === undefined
        ? null
        : toNumber(item.countedQuantity),
    difference:
      item.difference === null || item.difference === undefined
        ? null
        : toNumber(item.difference),
    note: item.note ?? "",
    currentQuantity: toNumber(item.product.currentQuantity),
    minimumStock: toNumber(item.product.minimumStock)
  }));

  const countedItems = items?.filter((item) => item.countedQuantity !== null).length ?? 0;

  return {
    id: session.id,
    title: session.title,
    status: session.status,
    referenceDate: session.referenceDate,
    notes: session.notes ?? "",
    startedAt: session.startedAt,
    closedAt: session.closedAt,
    createdBy: session.createdBy,
    closedBy: session.closedBy ?? null,
    summary: {
      totalItems: items?.length ?? 0,
      countedItems,
      pendingItems: (items?.length ?? 0) - countedItems
    },
    items: items ?? []
  };
}

export async function createCountSession(
  input: { title: string; referenceDate: Date; notes?: string },
  userId: string
) {
  const openSession = await prisma.stockCountSession.findFirst({
    where: { status: "OPEN" }
  });

  if (openSession) {
    throw createHttpError(400, "Ja existe uma contagem aberta");
  }

  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      include: {
        category: true
      },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }]
    });

    const session = await tx.stockCountSession.create({
      data: {
        title: input.title,
        referenceDate: input.referenceDate,
        notes: input.notes || null,
        createdById: userId,
        items: {
          create: products.map((product) => ({
            productId: product.id,
            systemQuantity: product.currentQuantity
          }))
        }
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          },
          orderBy: [{ product: { category: { name: "asc" } } }, { product: { name: "asc" } }]
        }
      }
    });

    await logAction(tx, {
      userId,
      action: "stock_count.created",
      entityType: "stock_count_session",
      entityId: session.id,
      details: { title: input.title }
    });

    return serializeCountSession(session);
  });
}

export async function updateCountItems(
  sessionId: string,
  input: { items: Array<{ productId: string; countedQuantity: number; note?: string }> },
  userId: string
) {
  const session = await prisma.stockCountSession.findUnique({
    where: { id: sessionId }
  });

  if (!session) {
    throw createHttpError(404, "Contagem nao encontrada");
  }

  if (session.status !== "OPEN") {
    throw createHttpError(400, "Essa contagem ja foi fechada");
  }

  await prisma.$transaction(async (tx) => {
    for (const item of input.items) {
      const existing = await tx.stockCountItem.findFirst({
        where: {
          sessionId,
          productId: item.productId
        }
      });

      if (!existing) {
        continue;
      }

      const difference = Number((item.countedQuantity - toNumber(existing.systemQuantity)).toFixed(3));

      await tx.stockCountItem.update({
        where: { id: existing.id },
        data: {
          countedQuantity: toDecimal(item.countedQuantity),
          difference: toDecimal(difference),
          note: item.note || null
        }
      });
    }

    await logAction(tx, {
      userId,
      action: "stock_count.items.updated",
      entityType: "stock_count_session",
      entityId: sessionId,
      details: { items: input.items.length }
    });
  });

  return getCountSession(sessionId);
}

export async function finalizeCountSession(sessionId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.stockCountSession.findUnique({
      where: { id: sessionId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!session) {
      throw createHttpError(404, "Contagem nao encontrada");
    }

    if (session.status !== "OPEN") {
      throw createHttpError(400, "Essa contagem ja foi fechada");
    }

    const pendingItems = session.items.filter((item) => item.countedQuantity === null);

    if (pendingItems.length > 0) {
      throw createHttpError(400, "Preencha a contagem de todos os itens antes de fechar");
    }

    const closedAt = new Date();

    for (const item of session.items) {
      const countedQuantity = toNumber(item.countedQuantity);
      const currentQuantity = toNumber(item.product.currentQuantity);
      const delta = Number((countedQuantity - currentQuantity).toFixed(3));

      const nextStatus = getProductStatus(countedQuantity, toNumber(item.product.minimumStock));

      await tx.product.update({
        where: { id: item.productId },
        data: {
          currentQuantity: toDecimal(countedQuantity),
          status: nextStatus,
          lastPhysicalCountAt: closedAt
        }
      });

      if (delta !== 0) {
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            userId,
            type: "ADJUSTMENT",
            quantity: toDecimal(Math.abs(delta)),
            delta: toDecimal(delta),
            quantityBefore: toDecimal(currentQuantity),
            quantityAfter: toDecimal(countedQuantity),
            note: `Ajuste por fechamento da contagem ${session.title}`,
            occurredAt: closedAt
          }
        });
      }
    }

    await tx.stockCountSession.update({
      where: { id: sessionId },
      data: {
        status: "CLOSED",
        closedAt,
        closedById: userId
      }
    });

    await logAction(tx, {
      userId,
      action: "stock_count.closed",
      entityType: "stock_count_session",
      entityId: sessionId,
      details: { closedAt }
    });

    return getCountSession(sessionId, tx);
  });
}

export async function getCountSession(sessionId: string, db: any = prisma) {
  const session = await db.stockCountSession.findUnique({
    where: { id: sessionId },
    include: {
      createdBy: { select: { id: true, name: true } },
      closedBy: { select: { id: true, name: true } },
      items: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        },
        orderBy: [{ product: { category: { name: "asc" } } }, { product: { name: "asc" } }]
      }
    }
  });

  if (!session) {
    throw createHttpError(404, "Contagem nao encontrada");
  }

  return serializeCountSession(session);
}

export async function listCountOverview() {
  const [sessions, activeSession, latestAnalysis] = await Promise.all([
    prisma.stockCountSession.findMany({
      include: {
        createdBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: [{ referenceDate: "desc" }, { startedAt: "desc" }],
      take: 12
    }),
    prisma.stockCountSession.findFirst({
      where: { status: "OPEN" },
      include: {
        createdBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          },
          orderBy: [{ product: { category: { name: "asc" } } }, { product: { name: "asc" } }]
        }
      }
    }),
    getLatestCountAnalysis()
  ]);

  return {
    sessions: sessions.map(serializeCountSession),
    activeSession: activeSession ? serializeCountSession(activeSession) : null,
    latestAnalysis
  };
}

export async function getLatestCountAnalysis() {
  const sessions = await prisma.stockCountSession.findMany({
    where: { status: "CLOSED" },
    orderBy: { closedAt: "desc" },
    take: 2
  });

  if (sessions.length < 2 || !sessions[0].closedAt || !sessions[1].closedAt) {
    return {
      available: false,
      message: "Feche pelo menos duas contagens para liberar a analise mensal."
    };
  }

  const currentSession = sessions[0];
  const previousSession = sessions[1];
  const currentClosedAt = currentSession.closedAt as Date;
  const previousClosedAt = previousSession.closedAt as Date;

  const [currentItems, previousItems, outflowGroups, lowStockProducts] = await Promise.all([
    prisma.stockCountItem.findMany({
      where: { sessionId: currentSession.id },
      include: {
        product: {
          include: { category: true }
        }
      }
    }),
    prisma.stockCountItem.findMany({
      where: { sessionId: previousSession.id }
    }),
    prisma.stockMovement.groupBy({
      by: ["productId"],
      where: {
        occurredAt: {
          gt: startOfDay(previousClosedAt),
          lte: endOfDay(currentClosedAt)
        },
        type: {
          in: ["EXIT", "LOSS"]
        }
      },
      _sum: {
        quantity: true
      }
    }),
    prisma.product.findMany({
      where: {
        status: {
          in: ["LOW", "CRITICAL", "ZEROED"]
        }
      },
      include: {
        category: true
      },
      orderBy: [{ restockPriority: "desc" }, { name: "asc" }],
      take: 10
    })
  ]);

  const previousMap = new Map(previousItems.map((item) => [item.productId, item]));
  const outflowProductIds = outflowGroups.map((item) => item.productId);
  const outflowProducts = await prisma.product.findMany({
    where: {
      id: { in: outflowProductIds.length ? outflowProductIds : [""] }
    }
  });
  const outflowMap = new Map(outflowProducts.map((item) => [item.id, item.name]));

  const rankedOutflows = outflowGroups
    .map((group) => ({
      productId: group.productId,
      productName: outflowMap.get(group.productId) ?? group.productId,
      total: toNumber(group._sum.quantity)
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const countDifferences = currentItems
    .map((item) => {
      const previousItem = previousMap.get(item.productId);
      const previousCount = previousItem?.countedQuantity ?? previousItem?.systemQuantity ?? 0;
      const currentCount = item.countedQuantity ?? item.systemQuantity;
      return {
        productId: item.productId,
        productName: item.product.name,
        categoryName: item.product.category.name,
        previousCount: toNumber(previousCount),
        currentCount: toNumber(currentCount),
        variation: Number((toNumber(currentCount) - toNumber(previousCount)).toFixed(3))
      };
    })
    .sort((a, b) => Math.abs(b.variation) - Math.abs(a.variation));

  return {
    available: true,
    period: {
      from: previousClosedAt,
      to: currentClosedAt,
      previousTitle: previousSession.title,
      currentTitle: currentSession.title
    },
    summary: {
      totalCountedProducts: currentItems.length,
      totalOutflowUnits: rankedOutflows.reduce((sum, item) => sum + item.total, 0),
      productsWithOutflow: rankedOutflows.length
    },
    topOutflows: rankedOutflows.slice(0, 5),
    lowOutflows: [...rankedOutflows].reverse().slice(0, 5),
    countDifferences: countDifferences.slice(0, 10),
    replenishmentFocus: lowStockProducts.map((product) => ({
      productId: product.id,
      productName: product.name,
      categoryName: product.category.name,
      currentQuantity: toNumber(product.currentQuantity),
      minimumStock: toNumber(product.minimumStock),
      status: product.status
    }))
  };
}
