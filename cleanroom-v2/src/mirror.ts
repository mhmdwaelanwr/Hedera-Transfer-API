import { config } from "./config.js";

const timeoutMs = 8_000;

async function mirrorFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${config.MIRROR_NODE_URL}${path}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const error = new Error(`Mirror Node request failed (${response.status})`);
    Object.assign(error, { status: response.status, body: body.slice(0, 500) });
    throw error;
  }

  return response.json() as Promise<T>;
}

type BalanceResponse = {
  balances?: Array<{ account: string; balance: number }>;
};

type ExchangeRateResponse = {
  current_rate?: {
    cent_equivalent: number;
    hbar_equivalent: number;
  };
};

export async function getAccountBalance(accountId: string) {
  const data = await mirrorFetch<BalanceResponse>(
    `/api/v1/balances?account.id=${encodeURIComponent(accountId)}&limit=1`,
  );

  const row = data.balances?.[0];
  if (!row) {
    const error = new Error("Account not found");
    Object.assign(error, { status: 404 });
    throw error;
  }

  const tinybars = Number(row.balance);
  return {
    accountId: row.account,
    tinybars,
    hbars: tinybars / 100_000_000,
  };
}

export async function estimateFeeInHbar(usdFee = 0.0001) {
  const data = await mirrorFetch<ExchangeRateResponse>("/api/v1/network/exchangerate");
  const rate = data.current_rate;
  if (!rate || !rate.cent_equivalent || !rate.hbar_equivalent) return null;

  const usdPerHbar = rate.cent_equivalent / rate.hbar_equivalent / 100;
  if (!Number.isFinite(usdPerHbar) || usdPerHbar <= 0) return null;
  return Number((usdFee / usdPerHbar).toFixed(8));
}

export async function getAccountHistory(accountId: string, limit: number) {
  return mirrorFetch<{
    transactions?: unknown[];
    links?: { next?: string | null };
  }>(
    `/api/v1/transactions?account.id=${encodeURIComponent(accountId)}&limit=${limit}&order=desc`,
  );
}

function normalizeTransactionId(transactionId: string) {
  if (!transactionId.includes("@")) return transactionId;

  const [accountId, timestamp] = transactionId.split("@", 2);
  if (!accountId || !timestamp) return transactionId;

  const dot = timestamp.indexOf(".");
  if (dot < 0) return transactionId;

  const seconds = timestamp.slice(0, dot);
  const nanos = timestamp.slice(dot + 1);
  return `${accountId}-${seconds}-${nanos}`;
}

export async function getTransaction(transactionId: string) {
  return mirrorFetch<unknown>(
    `/api/v1/transactions/${encodeURIComponent(normalizeTransactionId(transactionId))}`,
  );
}
