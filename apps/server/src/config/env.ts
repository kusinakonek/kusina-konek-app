import dotenv from "dotenv";
import path from "path";

// Load .env from the root of the monorepo
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const requireEnv = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
  SUPABASE_URL: requireEnv("SUPABASE_URL"),
  SUPABASE_ANON_KEY: requireEnv("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  DATABASE_URL: requireEnv("DATABASE_URL"),
  JWT_SECRET: requireEnv("JWT_SECRET", "kusina-konek-default-secret"),
  ENCRYPTION_KEY: requireEnv("ENCRYPTION_KEY", "0000000000000000000000000000000000000000000000000000000000000000") // Default dummy key for dev (64 zeros)
};
