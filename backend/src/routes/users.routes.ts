import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { listUsers } from "../services/stock.service.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get("/", async (_request, response, next) => {
  try {
    const users = await listUsers();
    response.json({ users });
  } catch (error) {
    next(error);
  }
});

