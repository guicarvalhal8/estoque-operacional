import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { productNoteSchema, productQuerySchema, productSchema } from "../schemas/product.schemas.js";
import {
  addProductNote,
  createProduct,
  listProducts,
  updateProduct
} from "../services/stock.service.js";

export const productsRouter = Router();

productsRouter.use(requireAuth);

productsRouter.get("/", validate(productQuerySchema, "query"), async (request, response, next) => {
  try {
    const products = await listProducts(request.query);
    response.json({ products });
  } catch (error) {
    next(error);
  }
});

productsRouter.post(
  "/",
  requireRole(["ADMIN"]),
  validate(productSchema),
  async (request, response, next) => {
    try {
      const product = await createProduct(request.body, request.user!.id);
      response.status(201).json({ product });
    } catch (error) {
      next(error);
    }
  }
);

productsRouter.patch(
  "/:productId",
  requireRole(["ADMIN"]),
  validate(productSchema),
  async (request, response, next) => {
    try {
      const product = await updateProduct(
        String(request.params.productId),
        request.body,
        request.user!.id
      );
      response.json({ product });
    } catch (error) {
      next(error);
    }
  }
);

productsRouter.post(
  "/:productId/notes",
  requireRole(["ADMIN", "MANAGER", "OPERATOR"]),
  validate(productNoteSchema),
  async (request, response, next) => {
    try {
      const note = await addProductNote(
        String(request.params.productId),
        request.body.content,
        request.user!.id
      );
      response.status(201).json({ note });
    } catch (error) {
      next(error);
    }
  }
);
