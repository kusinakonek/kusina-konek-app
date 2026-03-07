import dotenv from "dotenv";
import fs from "node:fs";
import path from "path";

const findEnvFile = (startDir: string) => {
  let currentDir = path.resolve(startDir);

  while (true) {
    const candidate = path.join(currentDir, ".env");
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
};

const envPath = findEnvFile(process.cwd()) ?? findEnvFile(__dirname);

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const requireEnv = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
  SUPABASE_URL: requireEnv("SUPABASE_URL"),
  SUPABASE_ANON_KEY: requireEnv("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  DATABASE_URL: requireEnv("DATABASE_URL"),
  JWT_SECRET: requireEnv("JWT_SECRET", "kusina-konek-default-secret"),
  ENCRYPTION_KEY: requireEnv("ENCRYPTION_KEY", "0000000000000000000000000000000000000000000000000000000000000000") // Default dummy key for dev (64 zeros)
};
