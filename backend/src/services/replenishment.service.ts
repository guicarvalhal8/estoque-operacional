import { prisma } from "../lib/prisma.js";
import { toDecimal, toNumber } from "../utils/decimal.js";
import { logAction } from "./action-log.service.js";

export async function getReplenishmentSuggestions() {
  const products = await prisma.product.findMany({
    where: {
      status: {
        in: ["LOW", "CRITICAL", "ZEROED"]
      }
    },
    include: {
      category: true,
      alert: true
    },
    orderBy: [{ restockPriority: "desc" }, { status: "asc" }, { name: "asc" }]
  });

  return products.map((product) => {
    const currentQuantity = toNumber(product.currentQuantity);
    const minimumStock = toNumber(product.minimumStock);
    const suggestedQuantity = Math.max(minimumStock - currentQuantity, 0);

    return {
      productId: product.id,
      productName: product.name,
      categoryName: product.category.name,
      currentQuantity,
      minimumStock,
      suggestedQuantity,
      unit: product.unit,
      priority: product.restockPriority,
      supplier: product.supplier ?? "",
      status: product.status
    };
  });
}

export async function listPurchaseOrders() {
  const orders = await prisma.purchaseOrder.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          role: true
        }
      },
      items: {
        orderBy: [{ priority: "desc" }, { productName: "asc" }]
      }
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return orders.map((order) => ({
    id: order.id,
    title: order.title,
    status: order.status,
    notes: order.notes ?? "",
    createdAt: order.createdAt,
    orderedAt: order.orderedAt,
    createdBy: order.createdBy,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      unit: item.unit,
      quantitySuggested: toNumber(item.quantitySuggested),
      currentQuantity: toNumber(item.currentQuantity),
      minimumStock: toNumber(item.minimumStock),
      priority: item.priority
    }))
  }));
}

export async function createPurchaseOrder(
  input: { title: string; notes?: string },
  userId: string
) {
  const suggestions = await getReplenishmentSuggestions();

  if (!suggestions.length) {
    return {
      created: false,
      message: "Nao ha itens pendentes de reposicao"
    };
  }

  const order = await prisma.$transaction(async (tx) => {
    const purchaseOrder = await tx.purchaseOrder.create({
      data: {
        title: input.title,
        notes: input.notes || null,
        createdById: userId,
        items: {
          create: suggestions.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unit: item.unit,
            quantitySuggested: toDecimal(item.suggestedQuantity),
            currentQuantity: toDecimal(item.currentQuantity),
            minimumStock: toDecimal(item.minimumStock),
            priority: item.priority
          }))
        }
      }
    });

    await logAction(tx, {
      userId,
      action: "purchase_order.created",
      entityType: "purchase_order",
      entityId: purchaseOrder.id,
      details: { items: suggestions.length }
    });

    return purchaseOrder;
  });

  return {
    created: true,
    id: order.id
  };
}

export async function updatePurchaseOrderStatus(
  orderId: string,
  status: "PENDING" | "ORDERED",
  userId: string
) {
  const order = await prisma.purchaseOrder.update({
    where: { id: orderId },
    data: {
      status,
      orderedAt: status === "ORDERED" ? new Date() : null
    }
  });

  await logAction(prisma, {
    userId,
    action: "purchase_order.updated",
    entityType: "purchase_order",
    entityId: order.id,
    details: { status }
  });

  return order;
}

