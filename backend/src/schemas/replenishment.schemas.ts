import { z } from "zod";

export const createPurchaseOrderSchema = z.object({
  title: z.string().min(3).max(120),
  notes: z.string().max(300).optional().or(z.literal(""))
});

export const updatePurchaseOrderSchema = z.object({
  status: z.enum(["PENDING", "ORDERED"])
});

