import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables
dotenv.config();

// If DATABASE_URL is not set, also try loading from apps/api/.env
if (!process.env.DATABASE_URL) {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const apiEnvPath = path.resolve(currentDir, "../../.env");
  dotenv.config({ path: apiEnvPath });
}

export const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().min(1).default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required").default("campushub-super-secret-jwt-key-2026-production"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required").default("campushub-super-secret-refresh-key-2026-production"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  COOKIE_SECRET: z.string().min(32, "COOKIE_SECRET must be at least 32 characters long").default("campushub-cookie-encryption-secret-string-at-least-32-chars"),

  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3307),
  DB_USER: z.string().default("campushub_user"),
  DB_PASSWORD: z.string().default("Aathi@2004"),
  DB_NAME: z.string().default("campushub"),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  throw new Error("Invalid environment configuration. Please check your .env file.");
}

export const env: Env = parsed.data;
