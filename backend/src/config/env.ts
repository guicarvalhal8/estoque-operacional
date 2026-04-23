import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const booleanFromEnv = z
  .string()
  .optional()
  .transform((value) => value === "true");

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  PORT: z.coerce.number().default(4000),
  JWT_SECRET: z.string().min(12),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  FRONTEND_URLS: z
    .string()
    .default("http://localhost:3000")
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
    .pipe(z.array(z.string().url()).min(1)),
  COOKIE_SECURE: booleanFromEnv,
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).optional(),
  COOKIE_DOMAIN: z.string().min(1).optional()
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  COOKIE_SECURE:
    parsedEnv.COOKIE_SECURE ?? parsedEnv.NODE_ENV === "production",
  COOKIE_SAME_SITE:
    parsedEnv.COOKIE_SAME_SITE ?? (parsedEnv.NODE_ENV === "production" ? "none" : "lax")
};
