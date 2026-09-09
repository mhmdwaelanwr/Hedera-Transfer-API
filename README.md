# Hedera Transfer API

A small Node.js / Express API for experimenting with **Hedera Testnet** account balance queries, HBAR transfers, credential checks, and HashScan transaction links.

> **Status:** development / testnet prototype. This repository is not a production custody service and should not be used with real mainnet funds or production private keys.

## What it provides

- `GET /` — health response.
- `GET /account/balance/:id` — retrieves a Hedera Testnet account balance and an estimated fee value.
- `POST /account/transaction` — submits an HBAR transfer and returns the transaction ID, receipt, and HashScan URL.
- `POST /account/verify` — checks whether an account ID and private key can be used with the Hedera Testnet client.

## Technology

- Node.js 18+ — the implementation uses the built-in `fetch` API.
- Express.js.
- `@hashgraph/sdk`.
- Hedera Testnet and Hedera Mirror Node APIs.

## Security model

The current prototype accepts an `accountId` and `privateKey` in request bodies for transfer / verification operations. That makes it suitable only for controlled development and testnet experimentation.

**Do not:**

- expose this API publicly with real account credentials,
- send mainnet private keys through these endpoints,
- log request bodies containing private keys,
- treat this implementation as a production wallet or custody architecture.

A production design should use an explicit signing / custody model, authentication and authorization, rate limiting, request validation, secret-management boundaries, audit logging, and deployment-specific threat review.

## Getting started

```bash
git clone https://github.com/mhmdwaelanwr/Hedera-Transfer-API.git
cd Hedera-Transfer-API
npm install
npm start
```

The server currently listens on port `3000`.

Test the health endpoint:

```bash
curl http://localhost:3000/
```

Expected response:

```json
{
  "status": "Server is running",
  "ok": true
}
```

## API

### Get account balance

```http
GET /account/balance/0.0.12345
```

Example response shape:

```json
{
  "accountId": "0.0.12345",
  "hbars": "10.5 ℏ",
  "transactionFeeHbar": 0.0001,
  "balance": 10.5
}
```

### Transfer HBAR

```http
POST /account/transaction
Content-Type: application/json
```

Development/testnet request shape:

```json
{
  "accountId": "0.0.12345",
  "privateKey": "<TESTNET_PRIVATE_KEY>",
  "amount": 1,
  "receiverAccountId": "0.0.67890"
}
```

A successful response includes the sender, receiver, amount, Hedera transaction ID, HashScan URL, execution timestamp, and transaction receipt.

### Verify development credentials

```http
POST /account/verify
Content-Type: application/json
```

```json
{
  "accountId": "0.0.12345",
  "privateKey": "<TESTNET_PRIVATE_KEY>"
}
```

## Related client

The Android client lives at:

- [Hedera-Transfer-App](https://github.com/mhmdwaelanwr/Hedera-Transfer-App)

## Scope and limitations

- Testnet is hard-coded in the current implementation.
- The service does not currently provide production authentication or authorization.
- Transfer signing uses credentials supplied by the request.
- Error responses are development-oriented and should be reviewed before any public deployment.
- No production availability or custody guarantees are claimed.

## License

Distributed under the [MIT License](LICENSE).