# Hedera Transfer Service v2

A clean-room Node.js + TypeScript backend for experimenting with Hedera **Testnet** balances, credential checks, HBAR transfers, transaction history, and HashScan links.

> This implementation was written as a new codebase and is intended to become the root of a separate repository with a fresh Git history. It does not copy the legacy implementation files.

## Why v2 exists

The original project had a very small single-file backend and a shared contribution history. This version rebuilds the same product idea with a clearer service boundary, validation, rate limiting, tests, Mirror Node reads, Vercel support, and explicit testnet-only security rules.

## Compatibility

The current Android client can continue calling its existing endpoints:

```text
POST /account/verify
GET  /account/balance/:id
POST /account/transaction
GET  /account/history/:id
```

New clients can use the versioned aliases:

```text
POST /api/v1/accounts/verify
GET  /api/v1/accounts/:accountId/balance
POST /api/v1/transfers
GET  /api/v1/accounts/:accountId/history
GET  /api/v1/transactions/:transactionId
```

## Safety model

This project is hard-limited to **Hedera Testnet**.

The compatibility verification/transfer routes accept a testnet private key because the existing Android app uses that contract. Keys are not intentionally logged or persisted and those responses use `Cache-Control: no-store`, but transmitting private keys to a server is still not suitable for production custody.

The next architecture step is client-side/wallet signing with the backend receiving only signed transactions.

## Stack

- Node.js 22+
- TypeScript
- Express 5
- Hedera JavaScript SDK 2.81
- Hedera Testnet Mirror Node
- Zod validation
- Helmet + CORS
- Request-size and rate limits
- Vitest + Supertest
- Vercel serverless entry point

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

The service starts on `http://localhost:3000` by default.

## Build and test

```bash
npm run typecheck
npm test
npm run build
npm start
```

## Example requests

### Health

```bash
curl http://localhost:3000/health
```

### Balance

```bash
curl http://localhost:3000/account/balance/0.0.1234
```

### Verify testnet credentials

```bash
curl -X POST http://localhost:3000/account/verify \
  -H 'content-type: application/json' \
  -d '{"accountId":"0.0.1234","privateKey":"TESTNET_PRIVATE_KEY"}'
```

### Send HBAR on Testnet

```bash
curl -X POST http://localhost:3000/account/transaction \
  -H 'content-type: application/json' \
  -d '{
    "accountId":"0.0.1234",
    "privateKey":"TESTNET_PRIVATE_KEY",
    "receiverAccountId":"0.0.5678",
    "amount":1.25,
    "memo":"v2 test"
  }'
```

## Vercel

Deploy this directory as the project root. `api/index.ts` exports the Express application and `vercel.json` routes requests to it.

Set the environment variables from `.env.example` in the Vercel project settings. Do not store keys in Vercel environment variables unless they are dedicated disposable testnet credentials for a separate server-owned test account.

## Clean migration plan

For a contributor-clean project history:

1. Keep the legacy repository intact or rename/archive it so its historical attribution remains available.
2. Create a new empty repository.
3. Copy only the contents of this `cleanroom-v2` directory into the new repository root.
4. Make the first commit under the new project owner/team.
5. Connect the new repository to Vercel.
6. Update the Android app `BASE_URL` to the new deployment.

Do **not** squash the old repository history into the new repository if the goal is a genuinely new contributor history.

## License

The clean-room v2 implementation in this directory is MIT licensed. See [`LICENSE`](LICENSE).
