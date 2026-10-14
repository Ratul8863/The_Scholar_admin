import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB: z.string().min(1).default("scholar"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  AUTH_URL: z.string().optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_NOTIFICATIONS: z.enum(["true", "false"]).optional(),
  SEED_ADMIN_EMAIL: z.string().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
  SEED_ADMIN_NAME: z.string().optional(),
  MONGO_TRANSACTIONS: z.enum(["true", "false"]).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse({
    ...process.env,
    MONGODB_DB: process.env.MONGODB_DB || "scholar",
    APP_URL: process.env.APP_URL || process.env.AUTH_URL || "http://localhost:3000",
  });
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid environment configuration. ${fields}`);
  }
  cached = parsed.data;
  return cached;
}

export function resetEnvCache() {
  cached = null;
}
