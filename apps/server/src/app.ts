import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { prisma } from "@kusinakonek/database";
import { errorHandler } from "./middlewares/errorHandler";
import { apiRouter } from "./routes";

export const app = express();

// Disable ETag so API responses always return 200 with a fresh body
// (prevents React Native / OkHttp from serving stale 304 responses)
app.set("etag", false);

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

// Prevent HTTP caching for all /api responses
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

app.get("/health", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ok", db: "connected" });
    } catch (error: any) {
        res.status(503).json({ status: "ok", db: "disconnected", message: error?.message ?? "DB connection failed" });
    }
});

// Database connection check endpoint
app.get("/db-check", async (_req, res) => {
    try {
        // Test basic connection
        const result = await prisma.$queryRaw`SELECT NOW() as current_time, current_database() as db_name`;

        // Check for tables
        const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

        const tableNames = (tables as any[]).map(t => t.table_name);
        const expectedTables = ['Role', 'Status', 'User', 'Address', 'Food', 'DropOffLocation', 'Distribution', 'Feedback'];

        const tableStatus = expectedTables.map(table => ({
            name: table,
            exists: tableNames.includes(table)
        }));

        res.json({
            status: "connected",
            database: (result as any)[0].db_name,
            serverTime: (result as any)[0].current_time,
            tables: tableStatus,
            allTablesExist: tableStatus.every(t => t.exists)
        });
    } catch (error: any) {
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
});

app.use("/api", apiRouter);

app.use(errorHandler);
