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
  PORT: z.coerce.number().int().min(1).max(65535),
  HOST: z.string().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  JWT_EXPIRES_IN: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string(),
  CORS_ORIGIN: z.string(),
  COOKIE_SECRET: z.string().min(32, "COOKIE_SECRET must be at least 32 characters long"),

  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().int().min(1).max(65535),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
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
