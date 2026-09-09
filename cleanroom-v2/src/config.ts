import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  HEDERA_NETWORK: z.literal("testnet").default("testnet"),
  MIRROR_NODE_URL: z.string().url().default("https://testnet.mirrornode.hedera.com"),
  ALLOWED_ORIGINS: z.string().default("*"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  MAX_TRANSFER_HBAR: z.coerce.number().positive().default(10_000),
});

const parsed = envSchema.parse(process.env);

export const config = {
  ...parsed,
  allowedOrigins:
    parsed.ALLOWED_ORIGINS.trim() === "*"
      ? ["*"]
      : parsed.ALLOWED_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean),
} as const;
