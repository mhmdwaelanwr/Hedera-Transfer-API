import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ZodError } from "zod";
import { config } from "./config.js";
import { transferHbar, verifyAccountCredentials } from "./hedera.js";
import {
  estimateFeeInHbar,
  getAccountBalance,
  getAccountHistory,
  getTransaction,
} from "./mirror.js";
import {
  accountIdSchema,
  historyQuerySchema,
  transferBodySchema,
  verifyBodySchema,
} from "./schemas.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.allowedOrigins.includes("*") || config.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Origin not allowed"));
      },
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  app.use(
    rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      limit: config.RATE_LIMIT_MAX,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );

  app.get("/", (_req, res) => {
    res.json({
      ok: true,
      service: "hedera-transfer-service",
      version: "2.0.0",
      network: "testnet",
      docs: "/health",
    });
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, network: "testnet", timestamp: new Date().toISOString() });
  });

  const balanceHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = accountIdSchema.parse(req.params.accountId ?? req.params.id);
      const [balance, feeEstimate] = await Promise.all([
        getAccountBalance(accountId),
        estimateFeeInHbar().catch(() => null),
      ]);

      res.json({
        accountId,
        hbars: balance.hbars.toString(),
        balance: balance.hbars,
        tinybars: balance.tinybars,
        transactionFeeHbar: feeEstimate,
        network: "testnet",
      });
    } catch (error) {
      next(error);
    }
  };

  app.get("/account/balance/:id", balanceHandler);
  app.get("/api/v1/accounts/:accountId/balance", balanceHandler);

  const historyHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = accountIdSchema.parse(req.params.accountId ?? req.params.id);
      const { limit } = historyQuerySchema.parse(req.query);
      const result = await getAccountHistory(accountId, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  app.get("/account/history/:id", historyHandler);
  app.get("/api/v1/accounts/:accountId/history", historyHandler);

  const verifyHandler = async (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const input = verifyBodySchema.parse(req.body);
      const result = await verifyAccountCredentials(input.accountId, input.privateKey);
      res.status(result.valid ? 200 : 401).json({
        ...result,
        message: result.valid ? "Credentials are valid for Hedera Testnet" : "Invalid account ID or private key",
        network: "testnet",
      });
    } catch (error) {
      next(error);
    }
  };

  app.post("/account/verify", verifyHandler);
  app.post("/api/v1/accounts/verify", verifyHandler);

  const transferHandler = async (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const input = transferBodySchema.parse(req.body);
      const result = await transferHbar(input);
      res.status(201).json({
        ...result,
        ok: true,
        network: "testnet",
      });
    } catch (error) {
      next(error);
    }
  };

  app.post("/account/transaction", transferHandler);
  app.post("/api/v1/transfers", transferHandler);

  app.get("/api/v1/transactions/:transactionId", async (req, res, next) => {
    try {
      const transactionId = String(req.params.transactionId ?? "").trim();
      if (!transactionId || transactionId.length > 200) {
        res.status(400).json({ error: "Invalid transaction ID" });
        return;
      }
      res.json(await getTransaction(transactionId));
    } catch (error) {
      next(error);
    }
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: "Invalid request",
        issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
      return;
    }

    const status =
      typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;

    const message = error instanceof Error ? error.message : "Unexpected server error";
    res.status(status >= 400 && status < 600 ? status : 500).json({
      error: status >= 500 ? "Upstream or server error" : message,
    });
  });

  return app;
}

export const app = createApp();
export default app;
