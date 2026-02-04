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

// Database connection check endpoint
app.get("/db-check", async (_req, res) => {
    try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

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

        await prisma.$disconnect();

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
