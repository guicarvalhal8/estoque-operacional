import { prisma } from "../lib/prisma.js";
import { toNumber } from "../utils/decimal.js";
import { serializeMovement, serializeProduct } from "../utils/serializers.js";

export async function getDashboardOverview(filters: {
  search?: string;
  categoryId?: string;
}) {
  const productWhere = {
    name: filters.search
      ? {
          contains: filters.search
        }
      : undefined,
    categoryId: filters.categoryId || undefined
  };

  const [products, lowStockProducts, zeroStockProducts, recentMovements] = await Promise.all([
    prisma.product.findMany({
      where: productWhere,
      include: {
        category: true,
        alert: true,
        notes: {
          orderBy: { createdAt: "desc" },
          take: 2
        }
      },
      orderBy: { name: "asc" }
    }),
    prisma.product.findMany({
      where: {
        ...productWhere,
        status: {
          in: ["LOW", "CRITICAL"]
        }
      },
      include: {
        category: true,
        alert: true,
        notes: {
          orderBy: { createdAt: "desc" },
          take: 2
        }
      },
      orderBy: [{ status: "asc" }, { restockPriority: "desc" }]
    }),
    prisma.product.findMany({
      where: {
        ...productWhere,
        status: "ZEROED"
      },
      include: {
        category: true,
        alert: true,
        notes: {
          orderBy: { createdAt: "desc" },
          take: 2
        }
      },
      orderBy: { name: "asc" }
    }),
    prisma.stockMovement.findMany({
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
      take: 12
    })
  ]);

  const totalStockUnits = products.reduce(
    (sum, product) => sum + toNumber(product.currentQuantity),
    0
  );

  return {
    summary: {
      totalProducts: products.length,
      totalStockUnits,
      lowStockCount: lowStockProducts.length,
      zeroStockCount: zeroStockProducts.length
    },
    lowStockProducts: lowStockProducts.map(serializeProduct),
    zeroStockProducts: zeroStockProducts.map(serializeProduct),
    recentMovements: recentMovements.map(serializeMovement),
    catalog: products.map(serializeProduct)
  };
}
