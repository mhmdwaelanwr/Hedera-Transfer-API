import {
  AccountInfoQuery,
  Client,
  Hbar,
  PrivateKey,
  TransferTransaction,
} from "@hashgraph/sdk";

function parsePrivateKey(value: string): PrivateKey {
  try {
    return PrivateKey.fromString(value.trim());
  } catch {
    const error = new Error("Invalid Hedera private key");
    Object.assign(error, { status: 400 });
    throw error;
  }
}

function createSignedClient(accountId: string, privateKey: string) {
  const client = Client.forTestnet();
  client.setOperator(accountId, parsePrivateKey(privateKey));
  return client;
}

export async function verifyAccountCredentials(accountId: string, privateKey: string) {
  const client = createSignedClient(accountId, privateKey);
  try {
    const info = await new AccountInfoQuery().setAccountId(accountId).execute(client);
    return {
      valid: true,
      accountId,
      publicKeyOnChain: info.key?.toString() ?? null,
    };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Verification failed";

    if (message.includes("INSUFFICIENT_PAYER_BALANCE")) {
      return {
        valid: true,
        accountId,
        publicKeyOnChain: null,
        warning: "Credentials appear valid, but the payer account has insufficient testnet balance for this query.",
      };
    }

    return { valid: false, accountId };
  } finally {
    client.close();
  }
}

export async function transferHbar(input: {
  accountId: string;
  privateKey: string;
  receiverAccountId: string;
  amount: number;
  memo?: string;
}) {
  const client = createSignedClient(input.accountId, input.privateKey);

  try {
    let transaction = new TransferTransaction()
      .addHbarTransfer(input.accountId, new Hbar(-input.amount))
      .addHbarTransfer(input.receiverAccountId, new Hbar(input.amount));

    if (input.memo) {
      transaction = transaction.setTransactionMemo(input.memo);
    }

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    const transactionId = response.transactionId.toString();

    return {
      status: receipt.status.toString(),
      from: input.accountId,
      to: input.receiverAccountId,
      amount: input.amount,
      memo: input.memo || null,
      transactionId,
      hashscan: `https://hashscan.io/testnet/transaction/${encodeURIComponent(transactionId)}`,
      executionTime: new Date().toISOString(),
    };
  } finally {
    client.close();
  }
}
