import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { apiRouter } from "./routes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", apiRouter);

app.use(errorHandler);
