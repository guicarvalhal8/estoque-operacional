import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(240).optional().or(z.literal(""))
});

