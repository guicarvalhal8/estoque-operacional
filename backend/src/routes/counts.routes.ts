import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createCountSessionSchema,
  updateCountItemsSchema
} from "../schemas/count.schemas.js";
import {
  createCountSession,
  finalizeCountSession,
  getCountSession,
  listCountOverview,
  updateCountItems
} from "../services/count.service.js";

export const countsRouter = Router();

countsRouter.use(requireAuth);
countsRouter.use(requireRole(["ADMIN", "MANAGER"]));

countsRouter.get("/overview", async (_request, response, next) => {
  try {
    const overview = await listCountOverview();
    response.json(overview);
  } catch (error) {
    next(error);
  }
});

countsRouter.get("/:sessionId", async (request, response, next) => {
  try {
    const session = await getCountSession(String(request.params.sessionId));
    response.json({ session });
  } catch (error) {
    next(error);
  }
});

countsRouter.post("/", validate(createCountSessionSchema), async (request, response, next) => {
  try {
    const session = await createCountSession(request.body, request.user!.id);
    response.status(201).json({ session });
  } catch (error) {
    next(error);
  }
});

countsRouter.patch(
  "/:sessionId/items",
  validate(updateCountItemsSchema),
  async (request, response, next) => {
    try {
      const session = await updateCountItems(
        String(request.params.sessionId),
        request.body,
        request.user!.id
      );
      response.json({ session });
    } catch (error) {
      next(error);
    }
  }
);

countsRouter.post("/:sessionId/finalize", async (request, response, next) => {
  try {
    const session = await finalizeCountSession(String(request.params.sessionId), request.user!.id);
    response.json({ session });
  } catch (error) {
    next(error);
  }
});

