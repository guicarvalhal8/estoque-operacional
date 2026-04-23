import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { movementQuerySchema, movementSchema } from "../schemas/movement.schemas.js";
import { createMovement, listMovements } from "../services/stock.service.js";

export const movementsRouter = Router();

movementsRouter.use(requireAuth);

movementsRouter.get(
  "/",
  requireRole(["ADMIN", "MANAGER"]),
  validate(movementQuerySchema, "query"),
  async (request, response, next) => {
    try {
      const movements = await listMovements(request.query);
      response.json({ movements });
    } catch (error) {
      next(error);
    }
  }
);

movementsRouter.post(
  "/",
  requireRole(["ADMIN", "OPERATOR"]),
  validate(movementSchema),
  async (request, response, next) => {
    try {
      const movement = await createMovement(request.body, request.user!.id);
      response.status(201).json({ movement });
    } catch (error) {
      next(error);
    }
  }
);
