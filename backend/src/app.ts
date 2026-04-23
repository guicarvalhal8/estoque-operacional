import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { authRouter } from "./routes/auth.routes.js";
import { categoriesRouter } from "./routes/categories.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { countsRouter } from "./routes/counts.routes.js";
import { movementsRouter } from "./routes/movements.routes.js";
import { productsRouter } from "./routes/products.routes.js";
import { reportsRouter } from "./routes/reports.routes.js";
import { replenishmentRouter } from "./routes/replenishment.routes.js";
import { usersRouter } from "./routes/users.routes.js";

export const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.FRONTEND_URLS.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origem nao permitida pelo CORS"));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (_request, response) => {
  response.json({
    status: "ok"
  });
});

app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter);
app.use("/counts", countsRouter);
app.use("/categories", categoriesRouter);
app.use("/products", productsRouter);
app.use("/movements", movementsRouter);
app.use("/reports", reportsRouter);
app.use("/replenishment", replenishmentRouter);
app.use("/users", usersRouter);

app.use(errorHandler);
