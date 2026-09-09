# Security Policy

## Scope

This service is intentionally limited to **Hedera Testnet**. It is not a custody platform and must not be used with mainnet funds or production private keys.

## Private-key compatibility routes

The legacy Android-compatible routes currently accept a testnet private key in the request body:

- `POST /account/verify`
- `POST /account/transaction`

The service does not persist or intentionally log these keys, sends `Cache-Control: no-store`, limits JSON request size, and applies global rate limiting. Even with these controls, sending private keys to a remote service is not an acceptable production architecture.

A future production design should move signing to the client or a wallet integration and submit only signed transactions to the backend.

## Never commit

- private keys
- `.env` files
- wallet recovery phrases
- production credentials
- access tokens

## Reporting

Please report security issues privately to the repository owner rather than opening a public issue containing secrets or exploit details.
