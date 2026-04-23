import { endOfDay, startOfDay } from "date-fns";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import { prisma } from "../lib/prisma.js";
import { toNumber } from "../utils/decimal.js";

function buildDateRange(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) {
    return undefined;
  }

  return {
    gte: startDate ? startOfDay(new Date(startDate)) : undefined,
    lte: endDate ? endOfDay(new Date(endDate)) : undefined
  };
}

export async function getReportData(filters: {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  productId?: string;
  type?: "ENTRY" | "EXIT" | "LOSS" | "ADJUSTMENT";
  userId?: string;
}) {
  const movementWhere = {
    productId: filters.productId || undefined,
    type: filters.type || undefined,
    userId: filters.userId || undefined,
    occurredAt: buildDateRange(filters.startDate, filters.endDate),
    product: filters.categoryId ? { categoryId: filters.categoryId } : undefined
  };

  const [movements, products, topExitGroups, topLossGroups] = await Promise.all([
    prisma.stockMovement.findMany({
      where: movementWhere,
      include: {
        product: {
          include: {
            category: true
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
    }),
    prisma.product.findMany({
      where: {
        categoryId: filters.categoryId || undefined,
        id: filters.productId || undefined
      },
      include: {
        category: true
      },
      orderBy: [{ status: "asc" }, { name: "asc" }]
    }),
    prisma.stockMovement.groupBy({
      by: ["productId"],
      where: {
        ...movementWhere,
        type: "EXIT"
      },
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: "desc"
        }
      },
      take: 5
    }),
    prisma.stockMovement.groupBy({
      by: ["productId"],
      where: {
        ...movementWhere,
        type: "LOSS"
      },
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: "desc"
        }
      },
      take: 5
    })
  ]);

  const productIds = [...new Set([...topExitGroups, ...topLossGroups].map((item) => item.productId))];
  const productMap = new Map(
    (
      await prisma.product.findMany({
        where: {
          id: { in: productIds.length ? productIds : [""] }
        }
      })
    ).map((product) => [product.id, product.name])
  );

  const totalStockUnits = products.reduce(
    (sum, product) => sum + toNumber(product.currentQuantity),
    0
  );

  const movementsToday = movements.filter((movement) => {
    const today = new Date();
    return movement.occurredAt >= startOfDay(today) && movement.occurredAt <= endOfDay(today);
  });

  const replenishmentNeed = products
    .filter((product) => ["LOW", "CRITICAL", "ZEROED"].includes(product.status))
    .map((product) => ({
      product: product.name,
      category: product.category.name,
      currentQuantity: toNumber(product.currentQuantity),
      minimumStock: toNumber(product.minimumStock),
      suggested: Math.max(
        toNumber(product.minimumStock) - toNumber(product.currentQuantity),
        0
      ),
      priority: product.restockPriority
    }));

  return {
    summary: {
      totalProducts: products.length,
      totalStockUnits,
      lowStockCount: products.filter((product) => product.status === "LOW").length,
      criticalCount: products.filter((product) =>
        ["CRITICAL", "ZEROED"].includes(product.status)
      ).length,
      movementsToday: movementsToday.length
    },
    currentStock: products.map((product) => ({
      product: product.name,
      category: product.category.name,
      quantity: toNumber(product.currentQuantity),
      unit: product.unit,
      minimumStock: toNumber(product.minimumStock),
      status: product.status,
      supplier: product.supplier ?? "",
      estimatedCost: product.estimatedCost ? toNumber(product.estimatedCost) : null
    })),
    dailyMovements: movementsToday.map((movement) => ({
      product: movement.product.name,
      type: movement.type,
      quantity: toNumber(movement.quantity),
      delta: toNumber(movement.delta),
      user: movement.user.name,
      note: movement.note ?? "",
      occurredAt: movement.occurredAt
    })),
    topExits: topExitGroups.map((group) => ({
      product: productMap.get(group.productId) ?? group.productId,
      total: toNumber(group._sum.quantity)
    })),
    topLosses: topLossGroups.map((group) => ({
      product: productMap.get(group.productId) ?? group.productId,
      total: toNumber(group._sum.quantity)
    })),
    replenishmentNeed
  };
}

export function buildExcelReport(reportData: Awaited<ReturnType<typeof getReportData>>) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([reportData.summary]),
    "Resumo"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(reportData.currentStock),
    "Estoque Atual"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(reportData.dailyMovements),
    "Movimentacoes"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(reportData.replenishmentNeed),
    "Reposicao"
  );
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export function buildPdfReport(reportData: Awaited<ReturnType<typeof getReportData>>) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 40 });

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Relatorio de Estoque");
    doc.moveDown();
    doc.fontSize(12).text(`Produtos monitorados: ${reportData.summary.totalProducts}`);
    doc.text(`Unidades totais: ${reportData.summary.totalStockUnits}`);
    doc.text(`Itens baixos: ${reportData.summary.lowStockCount}`);
    doc.text(`Itens criticos/zerados: ${reportData.summary.criticalCount}`);
    doc.text(`Movimentacoes do dia: ${reportData.summary.movementsToday}`);
    doc.moveDown();
    doc.fontSize(14).text("Necessidade de reposicao");
    doc.moveDown(0.5);

    reportData.replenishmentNeed.slice(0, 15).forEach((item) => {
      doc
        .fontSize(10)
        .text(
          `${item.product} | atual ${item.currentQuantity} | minimo ${item.minimumStock} | sugerido ${item.suggested}`
        );
    });

    doc.moveDown();
    doc.fontSize(14).text("Top saidas");
    reportData.topExits.forEach((item) => {
      doc.fontSize(10).text(`${item.product}: ${item.total}`);
    });

    doc.moveDown();
    doc.fontSize(14).text("Top perdas");
    reportData.topLosses.forEach((item) => {
      doc.fontSize(10).text(`${item.product}: ${item.total}`);
    });

    doc.end();
  });
}

