import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

export function validate(schema: ZodTypeAny, target: "body" | "query" | "params" = "body") {
  return (request: Request, _response: Response, next: NextFunction) => {
    request[target] = schema.parse(request[target]);
    next();
  };
}
