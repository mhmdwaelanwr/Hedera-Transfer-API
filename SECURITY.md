# Security Policy

## Scope

Hedera Transfer API is a **development / Hedera Testnet prototype**. It is not an audited wallet, custody service, or production transaction-signing system.

Do not deploy the current request-body private-key flow with mainnet funds or production credentials.

## Reporting a security issue

Please do not post private keys, tokens, account credentials, or exploit details containing live secrets in a public issue.

For a potentially sensitive report, contact the maintainer through the email listed on the GitHub profile:

- https://github.com/mhmdwaelanwr

Include enough information to reproduce the issue without including real production secrets.

## Credential handling

When testing this repository:

- use Hedera Testnet accounts only,
- use disposable development credentials,
- never commit private keys or `.env` files,
- do not log request bodies containing private keys,
- rotate any credential that is accidentally exposed.

## Production boundary

A production architecture would require a dedicated review of signing / custody, authentication and authorization, rate limiting, request validation, secret management, audit logging, deployment isolation, dependency security, and threat modeling.

The presence of this policy does not imply that the current prototype has completed those controls.