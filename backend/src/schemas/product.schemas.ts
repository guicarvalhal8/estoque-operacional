import { z } from "zod";

export const productQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["NORMAL", "LOW", "CRITICAL", "ZEROED"]).optional()
});

export const productSchema = z.object({
  name: z.string().min(2).max(120),
  categoryId: z.string().min(1),
  currentQuantity: z.coerce.number().min(0),
  unit: z.string().min(1).max(20),
  minimumStock: z.coerce.number().min(0),
  observations: z.string().max(500).optional().or(z.literal("")),
  supplier: z.string().max(120).optional().or(z.literal("")),
  estimatedCost: z.coerce.number().min(0).optional(),
  restockPriority: z.coerce.number().int().min(1).max(3).default(2)
});

export const productNoteSchema = z.object({
  content: z.string().min(2).max(300)
});

