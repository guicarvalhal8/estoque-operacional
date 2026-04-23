import { z } from "zod";

export const reportFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryId: z.string().optional(),
  productId: z.string().optional(),
  type: z.enum(["ENTRY", "EXIT", "LOSS", "ADJUSTMENT"]).optional(),
  userId: z.string().optional(),
  format: z.enum(["xlsx", "pdf"]).optional()
});
