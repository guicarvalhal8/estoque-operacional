import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema
} from "../schemas/replenishment.schemas.js";
import {
  createPurchaseOrder,
  getReplenishmentSuggestions,
  listPurchaseOrders,
  updatePurchaseOrderStatus
} from "../services/replenishment.service.js";

export const replenishmentRouter = Router();

replenishmentRouter.use(requireAuth);

replenishmentRouter.get(
  "/suggestions",
  requireRole(["ADMIN", "MANAGER"]),
  async (_request, response, next) => {
    try {
      const suggestions = await getReplenishmentSuggestions();
      response.json({ suggestions });
    } catch (error) {
      next(error);
    }
  }
);

replenishmentRouter.get(
  "/orders",
  requireRole(["ADMIN", "MANAGER"]),
  async (_request, response, next) => {
    try {
      const orders = await listPurchaseOrders();
      response.json({ orders });
    } catch (error) {
      next(error);
    }
  }
);

replenishmentRouter.post(
  "/orders",
  requireRole(["ADMIN", "MANAGER"]),
  validate(createPurchaseOrderSchema),
  async (request, response, next) => {
    try {
      const result = await createPurchaseOrder(request.body, request.user!.id);
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

replenishmentRouter.patch(
  "/orders/:orderId",
  requireRole(["ADMIN", "MANAGER"]),
  validate(updatePurchaseOrderSchema),
  async (request, response, next) => {
    try {
      const order = await updatePurchaseOrderStatus(
        String(request.params.orderId),
        request.body.status,
        request.user!.id
      );
      response.json({ order });
    } catch (error) {
      next(error);
    }
  }
);
