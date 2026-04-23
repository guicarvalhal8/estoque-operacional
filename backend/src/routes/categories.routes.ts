import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { categorySchema } from "../schemas/category.schemas.js";
import { createCategory, listCategories } from "../services/stock.service.js";

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get("/", async (_request, response, next) => {
  try {
    const categories = await listCategories();
    response.json({ categories });
  } catch (error) {
    next(error);
  }
});

categoriesRouter.post(
  "/",
  requireRole(["ADMIN"]),
  validate(categorySchema),
  async (request, response, next) => {
    try {
      const category = await createCategory(request.body, request.user!.id);
      response.status(201).json({ category });
    } catch (error) {
      next(error);
    }
  }
);
