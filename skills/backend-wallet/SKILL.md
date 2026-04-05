---
name: openfort-backend-wallets
description: >
  Always use this skill when the user asks about backend wallets, developer custody wallets,
  server-side wallet management, walletSecret, sendTransaction from backend, or programmatic
  wallet control with Openfort. Covers EVM and Solana backend wallets.
  Trigger on: "backend wallet", "developer custody", "server-side wallet", "walletSecret",
  "sendTransaction from backend", "import private key", "export private key", "EIP-7702",
  "Solana transfer server", "gasless", "fee sponsorship", "policy rules", "batch transactions",
  "sponsor gas", "webhook", or any server-side wallet operation with Openfort.
license: MIT
metadata:
  author: Openfort
  version: "1.0.0"
  homepage: https://openfort.io/docs/products/server
  source: https://github.com/openfort-xyz/agent-skills
inputs:
  - name: OPENFORT_API_KEY
    description: "Openfort API Secret Key (sk_test_... or sk_live_...) for server-side authentication"
    required: true
  - name: OPENFORT_WALLET_SECRET
    description: "EC P-256 private key for wallet-level authentication (two-layer auth)"
    required: true
  - name: OPENFORT_PUBLISHABLE_KEY
    description: "Publishable key (pk_test_...) — required for Solana gasless operations"
    required: false
references:
  - evm-wallets.md
  - solana-wallets.md
  - fee-sponsorship.md
  - policy-engine.md
---

# Openfort Backend Wallets (Developer Custody)

Backend wallets are server-controlled EOAs for automated blockchain operations — no user interaction required. Private keys are stored in **hardware-backed secure enclaves** and never leave the secure environment.

**When to use backend wallets** (vs embedded wallets):

| Use case | Backend wallet | Embedded wallet |
|----------|:-:|:-:|
| Server-side automation (treasury, minting, payroll, airdrops) | ✓ | |
| AI agent wallets (autonomous trading, payment processing) | ✓ | |
| Programmatic signing (no browser or user present) | ✓ | |
| Cross-border payments (automated stablecoin disbursement) | ✓ | |
| User-facing wallets (user controls the key) | | ✓ |
| Browser/mobile signing with user approval | | ✓ |

## Setup

```bash
npm install @openfort/openfort-node
# EVM peer dependency (required for sendTransaction):
npm install viem
# Solana peer dependencies (required for Solana operations):
npm install @solana/kit @solana-program/system @solana-program/compute-budget @solana-program/token @solana/kora @solana/transaction-confirmation
```

### Environment Variables

```env
OPENFORT_API_KEY=sk_test_...            # Secret API key (required)
OPENFORT_WALLET_SECRET=ws_...           # EC P-256 private key for signing ops (required for mutations)
OPENFORT_PUBLISHABLE_KEY=pk_test_...    # Required for Solana operations (Kora gasless)
OPENFORT_BASE_URL=https://api.openfort.io  # Optional, defaults to production
```

### Initialize

```ts
import Openfort from '@openfort/openfort-node'

const openfort = new Openfort(process.env.OPENFORT_API_KEY!, {
  walletSecret: process.env.OPENFORT_WALLET_SECRET!,
  publishableKey: process.env.OPENFORT_PUBLISHABLE_KEY,
})

// Or use env vars directly (auto-detected):
// OPENFORT_API_KEY, OPENFORT_WALLET_SECRET, OPENFORT_PUBLISHABLE_KEY
const openfort = new Openfort()
```

### Authentication Model

All mutating backend wallet requests (`POST`, `DELETE`, `PUT` on `/accounts/backend/*`) are authenticated with **two layers**:

1. **API Key** — Bearer token in `Authorization` header (`sk_test_...` or `sk_live_...`)
2. **Wallet Auth (X-Wallet-Auth)** — Signed with the wallet secret. The SDK generates this automatically.

The SDK handles auth generation transparently — just provide `walletSecret` at init.

> **Important**: Wallet-auth requests are **not retried** on failure. All other requests use automatic retry with exponential backoff.

## Quick Reference

- **EVM wallets**: See `references/evm-wallets.md` — create, list, send transactions (EIP-7702 gasless), sign data, delegate, import/export, delete
- **Solana wallets**: See `references/solana-wallets.md` — create, list, transfer SOL/SPL, send transactions, sign, import/export
- **Fee sponsorship**: See `references/fee-sponsorship.md` — strategy types, create via SDK or dashboard, CRUD, charge custom tokens
- **Policy engine**: See `references/policy-engine.md` — scope, priority, rules, EVM/Solana criteria, Zod validation

## Webhooks

Verify webhook signatures from Openfort using timing-safe comparison:

```ts
app.post('/webhook', async (req, res) => {
  const signature = req.headers['x-openfort-signature'] as string
  const body = req.body // raw string body

  try {
    const event = await openfort.constructWebhookEvent(body, signature)
    console.log('Webhook event:', event)
    res.status(200).send('OK')
  } catch (error) {
    console.error('Invalid webhook signature')
    res.status(400).send('Invalid signature')
  }
})
```

## Error Handling

### SDK Error Classes

```ts
import {
  AccountNotFoundError,
  DelegationError,
  EncryptionError,
  MissingWalletSecretError,
  MissingPublishableKeyError,
  MissingAPIKeyError,
  InvalidAPIKeyFormatError,
  InvalidWalletSecretFormatError,
  InvalidPublishableKeyFormatError,
  UserInputValidationError,
  TimeoutError,
} from '@openfort/openfort-node'
```

| Error | When |
|-------|------|
| `AccountNotFoundError` | `.get()` with non-existent ID/address |
| `DelegationError` | Chain ID not in `viem/chains` and no `rpcUrl` provided; or gasless flow failure |
| `EncryptionError` | RSA encryption/decryption failure during import/export |
| `MissingWalletSecretError` | Signing operation attempted without `walletSecret` configured |
| `MissingPublishableKeyError` | Solana operation attempted without `publishableKey` configured |
| `UserInputValidationError` | Invalid parameters (e.g., missing viem peer dependency) |
| `TimeoutError` | Operation timed out (e.g., Solana 60s confirmation timeout) |

### API Error Classes

```ts
import { APIError, NetworkError, ValidationError, UnknownError } from '@openfort/openfort-node'
```

| Error | Fields | When |
|-------|--------|------|
| `APIError` | `statusCode`, `errorType`, `errorMessage`, `correlationId`, `errorLink` | HTTP error from Openfort API |
| `NetworkError` | `networkDetails` | DNS failure, timeout, IP blocked, gateway error |
| `ValidationError` | `field`, `value` | Server-side input validation failure |

## Retry & Reliability

The SDK includes built-in retry with exponential backoff:

- **Retried**: network errors, 5xx responses, idempotent requests (GET, HEAD, DELETE, PUT)
- **NOT retried**: 4xx errors, wallet-auth requests
- **Solana confirmation**: timeout via WebSocket subscription

## SDK API Surface Overview

| Namespace | Purpose |
|-----------|---------|
| `openfort.accounts.evm.backend.*` | EVM backend wallet operations |
| `openfort.accounts.solana.backend.*` | Solana backend wallet operations |
| `openfort.accounts.evm.embedded.*` | Pre-generate embedded EVM wallets |
| `openfort.accounts.solana.embedded.*` | Pre-generate embedded Solana wallets |
| `openfort.policies.*` | Policy engine CRUD + evaluation |
| `openfort.feeSponsorship.*` | Gas sponsorship CRUD + enable/disable |
| `openfort.transactionIntents.*` | Transaction lifecycle + gas estimation |
| `openfort.iam.*` | User management + session verification |
| `openfort.paymasters.*` | ERC-4337 paymaster management |
| `openfort.contracts.*` | Smart contract registry |
| `openfort.subscriptions.*` | Event subscriptions |
| `openfort.triggers.*` | Trigger management |
| `openfort.sessions.*` | Session key management |
| `openfort.players.*` | Player management (deprecated → use `iam.users`) |
| `openfort.auth.*` | Third-party auth verification |

## Documentation & Resources

- **Full docs**: https://www.openfort.io/docs/products/server
- **SDK**: https://github.com/openfort-xyz/openfort-node
- **Dashboard**: https://dashboard.openfort.io
