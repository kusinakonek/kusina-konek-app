import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "@kusinakonek/database";

const start = async () => {
  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log("Database connected (Prisma)");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Database connection failed (Prisma)", error);
  }

  app.listen(env.PORT, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://0.0.0.0:${env.PORT}`);
    console.log(`Access from other devices using your machine's IP address`);
  });
};

start();
