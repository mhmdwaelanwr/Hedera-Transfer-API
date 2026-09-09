import { z } from "zod";
import { config } from "./config.js";

export const accountIdSchema = z
  .string()
  .trim()
  .regex(/^\d+\.\d+\.\d+$/, "Invalid Hedera account ID");

export const privateKeySchema = z
  .string()
  .trim()
  .min(32)
  .max(256);

export const verifyBodySchema = z.object({
  accountId: accountIdSchema,
  privateKey: privateKeySchema,
});

export const transferBodySchema = z.object({
  accountId: accountIdSchema,
  privateKey: privateKeySchema,
  receiverAccountId: accountIdSchema,
  amount: z.coerce.number().positive().max(config.MAX_TRANSFER_HBAR),
  memo: z.string().trim().max(100).optional().default(""),
});

export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
