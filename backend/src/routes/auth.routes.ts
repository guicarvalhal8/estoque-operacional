import { Router } from "express";
import { env } from "../config/env.js";
import { loginSchema } from "../schemas/auth.schemas.js";
import { authenticate, getCurrentUser } from "../services/auth.service.js";
import { signToken, requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";

export const authRouter = Router();

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: env.COOKIE_SAME_SITE,
    secure: env.COOKIE_SECURE,
    maxAge: 1000 * 60 * 60 * 8,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {})
  } as const;
}

authRouter.post("/login", validate(loginSchema), async (request, response, next) => {
  try {
    const user = await authenticate(request.body.email, request.body.password);
    const token = signToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "ADMIN" | "MANAGER" | "OPERATOR"
    });

    response.cookie("auth_token", token, buildCookieOptions());

    response.json({ user, token });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", (_request, response) => {
  response.clearCookie("auth_token", {
    httpOnly: true,
    sameSite: env.COOKIE_SAME_SITE,
    secure: env.COOKIE_SECURE,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {})
  });
  response.status(204).send();
});

authRouter.get("/me", requireAuth, async (request, response, next) => {
  try {
    const user = await getCurrentUser(request.user!.id);
    response.json({ user });
  } catch (error) {
    next(error);
  }
});
