import { toNumber } from "./decimal.js";

export function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export function serializeProduct(
  product: {
    id: string;
    name: string;
    unit: string;
    currentQuantity: number | string;
    minimumStock: number | string;
    observations?: string | null;
    status: string;
    supplier?: string | null;
    estimatedCost?: number | string | null;
    restockPriority: number;
    lastPhysicalCountAt?: Date | null;
    updatedAt: Date;
    category: { id: string; name: string };
    alert?: { id: string; level: string; message: string; isActive: boolean } | null;
    notes?: Array<{ id: string; content: string; pinned: boolean; createdAt: Date }>;
  }
) {
  return {
    id: product.id,
    name: product.name,
    unit: product.unit,
    currentQuantity: toNumber(product.currentQuantity),
    minimumStock: toNumber(product.minimumStock),
    observations: product.observations ?? "",
    status: product.status,
    supplier: product.supplier ?? "",
    estimatedCost:
      product.estimatedCost === undefined || product.estimatedCost === null
        ? null
        : toNumber(product.estimatedCost),
    restockPriority: product.restockPriority,
    lastPhysicalCountAt: product.lastPhysicalCountAt,
    updatedAt: product.updatedAt,
    category: product.category,
    alert: product.alert,
    notes:
      product.notes?.map((note) => ({
        id: note.id,
        content: note.content,
        pinned: note.pinned,
        createdAt: note.createdAt
      })) ?? []
  };
}

export function serializeMovement(
  movement: {
    id: string;
    type: string;
    quantity: number | string;
    delta: number | string;
    quantityBefore: number | string;
    quantityAfter: number | string;
    note?: string | null;
    occurredAt: Date;
    product: { id: string; name: string; unit: string };
    user: { id: string; name: string; role: string };
  }
) {
  return {
    id: movement.id,
    type: movement.type,
    quantity: toNumber(movement.quantity),
    delta: toNumber(movement.delta),
    quantityBefore: toNumber(movement.quantityBefore),
    quantityAfter: toNumber(movement.quantityAfter),
    note: movement.note ?? "",
    occurredAt: movement.occurredAt,
    product: movement.product,
    user: movement.user
  };
}
