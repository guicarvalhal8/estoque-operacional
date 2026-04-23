import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getStatus(
  currentQuantity: number,
  minimumStock: number
): "NORMAL" | "LOW" | "CRITICAL" | "ZEROED" {
  if (currentQuantity <= 0) return "ZEROED";
  if (currentQuantity <= minimumStock * 0.5) return "CRITICAL";
  if (currentQuantity <= minimumStock) return "LOW";
  return "NORMAL";
}

async function main() {
  const passwordMap = {
    admin: await bcrypt.hash("Admin@123", 10),
    manager: await bcrypt.hash("Gerente@123", 10),
    operator: await bcrypt.hash("Operadora@123", 10)
  };

  const users = [
    {
      name: "Administrador",
      email: "admin@estoque.local",
      passwordHash: passwordMap.admin,
      role: "ADMIN"
    },
    {
      name: "Gerente / Compras",
      email: "gerente@estoque.local",
      passwordHash: passwordMap.manager,
      role: "MANAGER"
    },
    {
      name: "Operadora de Estoque 1",
      email: "operadora1@estoque.local",
      passwordHash: passwordMap.operator,
      role: "OPERATOR"
    },
    {
      name: "Operadora de Estoque 2",
      email: "operadora2@estoque.local",
      passwordHash: passwordMap.operator,
      role: "OPERATOR"
    }
  ];

  for (const user of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!existingUser) {
      await prisma.user.create({ data: user });
      continue;
    }

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: user.name,
        role: user.role,
        isActive: true
      }
    });
  }

  const categories = [
    { name: "Pizzas", description: "Sabores e bases para producao de pizzas" },
    { name: "Massas", description: "Massas frescas e recheadas" },
    { name: "Molhos", description: "Molhos para preparo e finalizacao" },
    { name: "Risotos", description: "Bases e sabores de risoto" }
  ];

  const categoryMap = new Map<string, string>();

  for (const category of categories) {
    const existingCategory = await prisma.category.findUnique({
      where: { name: category.name }
    });

    if (existingCategory) {
      categoryMap.set(category.name, existingCategory.id);
      continue;
    }

    const created = await prisma.category.create({
      data: category
    });

    categoryMap.set(category.name, created.id);
  }

  const initialProducts = [
    {
      name: "Base doce",
      category: "Pizzas",
      currentQuantity: 17,
      unit: "un",
      minimumStock: 5,
      observations: "Quantidade inicial informada no levantamento",
      supplier: "",
      estimatedCost: 0,
      restockPriority: 2
    },
    {
      name: "Calabresa",
      category: "Pizzas",
      currentQuantity: 34,
      unit: "un",
      minimumStock: 10,
      observations: "Quantidade inicial informada no levantamento",
      supplier: "",
      estimatedCost: 0,
      restockPriority: 3
    },
    {
      name: "Mussarela",
      category: "Pizzas",
      currentQuantity: 9,
      unit: "un",
      minimumStock: 8,
      observations: "Quantidade inicial informada no levantamento",
      supplier: "",
      estimatedCost: 0,
      restockPriority: 2
    },
    {
      name: "Milho com bacon",
      category: "Pizzas",
      currentQuantity: 4,
      unit: "un",
      minimumStock: 6,
      observations: "Quantidade inicial informada no levantamento",
      supplier: "",
      estimatedCost: 0,
      restockPriority: 3
    },
    {
      name: "Quatro queijos",
      category: "Pizzas",
      currentQuantity: 13,
      unit: "un",
      minimumStock: 8,
      observations: "Quantidade inicial informada no levantamento",
      supplier: "",
      estimatedCost: 0,
      restockPriority: 2
    },
    {
      name: "Lombinho com requeijao",
      category: "Pizzas",
      currentQuantity: 12,
      unit: "un",
      minimumStock: 8,
      observations: "Quantidade inicial informada no levantamento",
      supplier: "",
      estimatedCost: 0,
      restockPriority: 2
    },
    {
      name: "Frango com requeijao",
      category: "Pizzas",
      currentQuantity: 16,
      unit: "un",
      minimumStock: 8,
      observations: "Quantidade inicial informada no levantamento",
      supplier: "",
      estimatedCost: 0,
      restockPriority: 2
    },
    {
      name: "Fetuccine",
      category: "Massas",
      currentQuantity: 0,
      unit: "un",
      minimumStock: 0,
      observations: "Quantidade inicial pendente de cadastro",
      supplier: "",
      estimatedCost: 0,
      restockPriority: 1
    },
    {
      name: "Ravioli",
      category: "Massas",
      currentQuantity: 0,
      unit: "un",
      minimumStock: 0,
      observations: "Quantidade inicial pendente de cadastro",
      supplier: "",
      estimatedCost: 0,
      restockPriority: 1
    },
    {
      name: "Bolonhesa",
      category: "Molhos",
      currentQuantity: 0,
      unit: "un",
      minimumStock: 0,
      observations: "Quantidade inicial pendente de cadastro",
      supplier: "",
      estimatedCost: 0,
      restockPriority: 1
    },
    {
      name: "Quatro queijos",
      category: "Molhos",
      currentQuantity: 0,
      unit: "un",
      minimumStock: 0,
      observations: "Quantidade inicial pendente de cadastro",
      supplier: "",
      estimatedCost: 0,
      restockPriority: 1
    },
    {
      name: "Sugo",
      category: "Molhos",
      currentQuantity: 0,
      unit: "un",
      minimumStock: 0,
      observations: "Quantidade inicial pendente de cadastro",
      supplier: "",
      estimatedCost: 0,
      restockPriority: 1
    },
    {
      name: "Quatro queijos",
      category: "Risotos",
      currentQuantity: 0,
      unit: "un",
      minimumStock: 0,
      observations: "Quantidade inicial pendente de cadastro",
      supplier: "",
      estimatedCost: 0,
      restockPriority: 1
    },
    {
      name: "Funghi",
      category: "Risotos",
      currentQuantity: 0,
      unit: "un",
      minimumStock: 0,
      observations: "Quantidade inicial pendente de cadastro",
      supplier: "",
      estimatedCost: 0,
      restockPriority: 1
    },
    {
      name: "Alho poro",
      category: "Risotos",
      currentQuantity: 0,
      unit: "un",
      minimumStock: 0,
      observations: "Quantidade inicial pendente de cadastro",
      supplier: "",
      estimatedCost: 0,
      restockPriority: 3
    }
  ];

  const operator = await prisma.user.findUniqueOrThrow({
    where: { email: "operadora1@estoque.local" }
  });

  for (const product of initialProducts) {
    const categoryId = categoryMap.get(product.category);

    if (!categoryId) {
      throw new Error(`Categoria nao encontrada para seed: ${product.category}`);
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        categoryId_name: {
          categoryId,
          name: product.name
        }
      }
    });

    const status = getStatus(product.currentQuantity, product.minimumStock);

    const storedProduct =
      existingProduct ??
      (await prisma.product.create({
        data: {
          name: product.name,
          categoryId,
          currentQuantity: product.currentQuantity,
          unit: product.unit,
          minimumStock: product.minimumStock,
          observations: product.observations,
          status,
          supplier: product.supplier,
          estimatedCost: product.estimatedCost,
          restockPriority: product.restockPriority
        }
      }));

    const existingNote = await prisma.note.findFirst({
      where: { productId: storedProduct.id, content: product.observations }
    });

    if (!existingNote) {
      await prisma.note.create({
        data: {
          productId: storedProduct.id,
          userId: operator.id,
          content: product.observations,
          pinned: true
        }
      });
    }

    if (!existingProduct && product.currentQuantity <= product.minimumStock) {
      await prisma.stockAlert.upsert({
        where: { productId: storedProduct.id },
        update: {
          level:
            product.currentQuantity <= product.minimumStock * 0.5 ? "CRITICAL" : "LOW",
          message:
            product.currentQuantity <= 0
              ? "Produto sem estoque"
              : "Produto abaixo do estoque minimo",
          isActive: true,
          resolvedAt: null
        },
        create: {
          productId: storedProduct.id,
          level:
            product.currentQuantity <= product.minimumStock * 0.5 ? "CRITICAL" : "LOW",
          message:
            product.currentQuantity <= 0
              ? "Produto sem estoque"
              : "Produto abaixo do estoque minimo"
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
