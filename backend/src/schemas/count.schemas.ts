import { z } from "zod";

export const createCountSessionSchema = z.object({
  title: z.string().min(3).max(120),
  referenceDate: z.coerce.date(),
  notes: z.string().max(300).optional().or(z.literal(""))
});

export const updateCountItemsSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      countedQuantity: z.coerce.number().min(0),
      note: z.string().max(200).optional().or(z.literal(""))
    })
  )
});

