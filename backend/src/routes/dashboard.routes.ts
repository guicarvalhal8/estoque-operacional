import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { getDashboardOverview } from "../services/dashboard.service.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/overview", async (request, response, next) => {
  try {
    const overview = await getDashboardOverview({
      search: typeof request.query.search === "string" ? request.query.search : undefined,
      categoryId:
        typeof request.query.categoryId === "string" ? request.query.categoryId : undefined
    });

    response.json(overview);
  } catch (error) {
    next(error);
  }
});

