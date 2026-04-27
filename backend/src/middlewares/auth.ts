import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { createHttpError } from "../lib/http-error.js";

type TokenPayload = {
  sub: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "OPERATOR";
};

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "8h"
  });
}

export function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const authHeader = request.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  const token = request.cookies?.auth_token ?? bearerToken;

  if (!token) {
    return next(createHttpError(401, "Sessao nao autenticada"));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    request.user = {
      id: decoded.sub,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role
    };
    return next();
  } catch {
    return next(createHttpError(401, "Token invalido"));
  }
}

export function requireRole(roles: Array<"ADMIN" | "MANAGER" | "OPERATOR">) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) {
      return next(createHttpError(401, "Sessao nao autenticada"));
    }

    if (!roles.includes(request.user.role)) {
      return next(createHttpError(403, "Permissao insuficiente"));
    }

    return next();
  };
}
