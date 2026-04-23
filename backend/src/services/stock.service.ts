import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { createHttpError } from "../lib/http-error.js";
import { toDecimal, toNumber } from "../utils/decimal.js";
import { getAlertPayload, getProductStatus } from "../utils/product-status.js";
import { serializeMovement, serializeProduct, serializeUser } from "../utils/serializers.js";
import { logAction } from "./action-log.service.js";

const productInclude = {
  category: true,
  alert: true,
  notes: {
    orderBy: {
      createdAt: "desc" as const
    },
    take: 4
  }
};

async function syncAlert(
  db: Prisma.TransactionClient,
  productId: string,
  currentQuantity: number,
  minimumStock: number
) {
  const alertPayload = getAlertPayload(currentQuantity, minimumStock);

  if (!alertPayload) {
    await db.stockAlert.upsert({
      where: { productId },
      update: {
        isActive: false,
        resolvedAt: new Date(),
        message: "Estoque normalizado"
      },
      create: {
        productId,
        level: "LOW",
        message: "Estoque normalizado",
        isActive: false,
        resolvedAt: new Date()
      }
    });
    return;
  }

  await db.stockAlert.upsert({
    where: { productId },
    update: {
      level: alertPayload.level,
      message: alertPayload.message,
      isActive: true,
      resolvedAt: null
    },
    create: {
      productId,
      level: alertPayload.level,
      message: alertPayload.message,
      isActive: true
    }
  });
}

export async function listProducts(filters: {
  search?: string;
  categoryId?: string;
  status?: "NORMAL" | "LOW" | "CRITICAL" | "ZEROED";
}) {
  const products = await prisma.product.findMany({
    where: {
      name: filters.search
        ? {
            contains: filters.search
          }
        : undefined,
      categoryId: filters.categoryId || undefined,
      status: filters.status || undefined
    },
    include: productInclude,
    orderBy: [
      { status: "asc" },
      { name: "asc" }
    ]
  });

  return products.map(serializeProduct);
}

export async function createProduct(
  input: {
    name: string;
    categoryId: string;
    currentQuantity: number;
    unit: string;
    minimumStock: number;
    observations?: string;
    supplier?: string;
    estimatedCost?: number;
    restockPriority: number;
  },
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const status = getProductStatus(input.currentQuantity, input.minimumStock);

    const createdProduct = await tx.product.create({
      data: {
        name: input.name,
        categoryId: input.categoryId,
        currentQuantity: toDecimal(input.currentQuantity),
        unit: input.unit,
        minimumStock: toDecimal(input.minimumStock),
        observations: input.observations || null,
        supplier: input.supplier || null,
        estimatedCost:
          input.estimatedCost === undefined ? null : toDecimal(input.estimatedCost),
        restockPriority: input.restockPriority,
        status
      },
      include: productInclude
    });

    if (input.observations) {
      await tx.note.create({
        data: {
          productId: createdProduct.id,
          userId,
          content: input.observations,
          pinned: true
        }
      });
    }

    if (input.currentQuantity > 0) {
      await tx.stockMovement.create({
        data: {
          productId: createdProduct.id,
          userId,
          type: "ENTRY",
          quantity: toDecimal(input.currentQuantity),
          delta: toDecimal(input.currentQuantity),
          quantityBefore: toDecimal(0),
          quantityAfter: toDecimal(input.currentQuantity),
          note: "Estoque inicial do cadastro",
          occurredAt: new Date()
        }
      });
    }

    await syncAlert(tx, createdProduct.id, input.currentQuantity, input.minimumStock);
    await logAction(tx, {
      userId,
      action: "product.created",
      entityType: "product",
      entityId: createdProduct.id,
      details: {
        name: input.name
      }
    });

    const product = await tx.product.findUniqueOrThrow({
      where: { id: createdProduct.id },
      include: productInclude
    });

    return serializeProduct(product);
  });
}

export async function updateProduct(
  productId: string,
  input: {
    name: string;
    categoryId: string;
    currentQuantity: number;
    unit: string;
    minimumStock: number;
    observations?: string;
    supplier?: string;
    estimatedCost?: number;
    restockPriority: number;
  },
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const existingProduct = await tx.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      throw createHttpError(404, "Produto nao encontrado");
    }

    const status = getProductStatus(input.currentQuantity, input.minimumStock);
    const adjustmentDelta = Number(
      (input.currentQuantity - toNumber(existingProduct.currentQuantity)).toFixed(3)
    );

    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: {
        name: input.name,
        categoryId: input.categoryId,
        currentQuantity: toDecimal(input.currentQuantity),
        unit: input.unit,
        minimumStock: toDecimal(input.minimumStock),
        observations: input.observations || null,
        supplier: input.supplier || null,
        estimatedCost:
          input.estimatedCost === undefined ? null : toDecimal(input.estimatedCost),
        restockPriority: input.restockPriority,
        status
      }
    });

    if (adjustmentDelta !== 0) {
      await tx.stockMovement.create({
        data: {
          productId: updatedProduct.id,
          userId,
          type: "ADJUSTMENT",
          quantity: toDecimal(Math.abs(adjustmentDelta)),
          delta: toDecimal(adjustmentDelta),
          quantityBefore: existingProduct.currentQuantity,
          quantityAfter: updatedProduct.currentQuantity,
          note: "Ajuste por edicao de cadastro do produto",
          occurredAt: new Date()
        }
      });
    }

    await syncAlert(tx, updatedProduct.id, input.currentQuantity, input.minimumStock);

    await logAction(tx, {
      userId,
      action: "product.updated",
      entityType: "product",
      entityId: updatedProduct.id,
      details: {
        previousQuantity: toNumber(existingProduct.currentQuantity),
        newQuantity: input.currentQuantity
      }
    });

    const product = await tx.product.findUniqueOrThrow({
      where: { id: updatedProduct.id },
      include: productInclude
    });

    return serializeProduct(product);
  });
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" }
  });
}

export async function createCategory(
  input: { name: string; description?: string },
  userId: string
) {
  const category = await prisma.category.create({
    data: {
      name: input.name,
      description: input.description || null
    }
  });

  await logAction(prisma, {
    userId,
    action: "category.created",
    entityType: "category",
    entityId: category.id,
    details: { name: category.name }
  });

  return category;
}

export async function addProductNote(
  productId: string,
  content: string,
  userId: string
) {
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) {
    throw createHttpError(404, "Produto nao encontrado");
  }

  const note = await prisma.note.create({
    data: {
      productId,
      userId,
      content,
      pinned: true
    }
  });

  await logAction(prisma, {
    userId,
    action: "product.note.created",
    entityType: "product",
    entityId: productId,
    details: { noteId: note.id }
  });

  return note;
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  });

  return users.map(serializeUser);
}

export async function listMovements(filters: {
  productId?: string;
  categoryId?: string;
  type?: "ENTRY" | "EXIT" | "LOSS" | "ADJUSTMENT";
  userId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
  const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
  }

  const movements = await prisma.stockMovement.findMany({
    where: {
      productId: filters.productId || undefined,
      type: filters.type || undefined,
      userId: filters.userId || undefined,
      occurredAt:
        startDate || endDate
          ? {
              gte: startDate,
              lte: endDate
            }
          : undefined,
      product: filters.categoryId
        ? {
            categoryId: filters.categoryId
          }
        : undefined
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          unit: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: { occurredAt: "desc" },
    take: 200
  });

  return movements.map(serializeMovement);
}

export async function createMovement(
  input: {
    productId: string;
    type: "ENTRY" | "EXIT" | "LOSS" | "ADJUSTMENT";
    quantity?: number;
    countedQuantity?: number;
    note?: string;
    occurredAt?: Date;
  },
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: input.productId }
    });

    if (!product) {
      throw createHttpError(404, "Produto nao encontrado");
    }

    const currentQuantity = toNumber(product.currentQuantity);
    let delta = 0;

    if (input.type === "ENTRY") delta = input.quantity ?? 0;
    if (input.type === "EXIT" || input.type === "LOSS") delta = -(input.quantity ?? 0);
    if (input.type === "ADJUSTMENT") {
      if (input.countedQuantity !== undefined) {
        delta = input.countedQuantity - currentQuantity;
      } else {
        delta = input.quantity ?? 0;
      }
    }

    const nextQuantity = Number((currentQuantity + delta).toFixed(3));

    if (nextQuantity < 0) {
      throw createHttpError(400, "Movimentacao deixaria o estoque negativo");
    }

    const minimumStock = toNumber(product.minimumStock);
    const nextStatus = getProductStatus(nextQuantity, minimumStock);
    const movementQuantity = Math.abs(delta);

    const updatedProduct = await tx.product.update({
      where: { id: product.id },
      data: {
        currentQuantity: toDecimal(nextQuantity),
        status: nextStatus,
        lastPhysicalCountAt:
          input.type === "ADJUSTMENT" && input.countedQuantity !== undefined
            ? input.occurredAt ?? new Date()
            : product.lastPhysicalCountAt
      }
    });

    const movement = await tx.stockMovement.create({
      data: {
        productId: product.id,
        userId,
        type: input.type,
        quantity: toDecimal(movementQuantity),
        delta: toDecimal(delta),
        quantityBefore: product.currentQuantity,
        quantityAfter: updatedProduct.currentQuantity,
        note: input.note || null,
        occurredAt: input.occurredAt ?? new Date()
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            unit: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    await syncAlert(tx, product.id, nextQuantity, minimumStock);

    await logAction(tx, {
      userId,
      action: "stock.movement.created",
      entityType: "stock_movement",
      entityId: movement.id,
      details: {
        productId: product.id,
        type: input.type,
        delta
      }
    });

    return serializeMovement(movement);
  });
}
