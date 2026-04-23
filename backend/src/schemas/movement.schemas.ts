import { z } from "zod";

export const movementSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["ENTRY", "EXIT", "LOSS", "ADJUSTMENT"]),
  quantity: z.coerce.number().refine((value) => value !== 0, "Quantidade nao pode ser zero").optional(),
  note: z.string().max(300).optional().or(z.literal("")),
  occurredAt: z.coerce.date().optional(),
  countedQuantity: z.coerce.number().min(0).optional()
}).superRefine((value, context) => {
  if (value.type === "ADJUSTMENT" && value.countedQuantity === undefined && value.quantity === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe uma quantidade de ajuste ou uma contagem fisica",
      path: ["quantity"]
    });
  }

  if (value.type !== "ADJUSTMENT" && value.quantity === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Quantidade obrigatoria",
      path: ["quantity"]
    });
  }
});

export const movementQuerySchema = z.object({
  productId: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.enum(["ENTRY", "EXIT", "LOSS", "ADJUSTMENT"]).optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});
