---
name: openfort-backend-wallets
description: >
  Create and operate Openfort backend wallets (developer custody) for EVM and Solana from server-side code.
  Use this skill whenever: creating backend wallets, sending transactions from server, importing/exporting
  private keys with RSA encryption, signing data/messages/typed-data server-side, EIP-7702 delegation,
  Solana transfers (SOL/SPL/USDC), gasless transactions, fee sponsorship, policy engine rules,
  wallet secret auth, webhooks, or operating wallets programmatically without user interaction.
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
  - name: OPENFORT_SECRET_KEY
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

> ⚠️ **Test keys vs. live keys — read before creating any wallet.**
> Openfort runs two fully isolated universes: **test mode** (`sk_test_…` / `pk_test_…`, testnet only) and **live mode** (`sk_live_…` / `pk_live_…`, mainnet, real funds). Objects created in one universe **cannot** be read, signed with, or recovered from the other.
> - A wallet created with a **test (dev) secret key exists only on testnet**. It is **not** usable in production and must **never** custody or move real funds.
> - To go to production, switch to your **live** secret key and create **fresh** wallets — never migrate or reuse test wallets across modes.
> - Secret keys (`sk_…`) are server-side only. Never commit them or expose them to a client.
> See https://openfort.io/docs/configuration/api-keys.

Backend wallets are server-controlled EOAs for automated blockchain operations — no user interaction required. Private keys are stored in **hardware-backed secure enclaves** and never leave the secure environment.

**When to use backend wallets** (vs embedded wallets):
- Server-side automation: treasury ops, batch minting, payroll, airdrops
- AI agent wallets: autonomous trading, payment processing
- Programmatic signing: no browser or user present
- Cross-border payments: automated stablecoin disbursement

**When to use embedded wallets instead:**
- User-facing wallets where the user controls the key
- Browser/mobile signing flows with user approval

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
OPENFORT_SECRET_KEY=sk_test_...            # Secret API key (required)
OPENFORT_WALLET_SECRET=...              # Base64-encoded EC P-256 private key (required for mutations)
OPENFORT_PUBLISHABLE_KEY=pk_test_...    # Required for Solana operations (Kora gasless)
OPENFORT_BASE_URL=https://api.openfort.io  # Optional, defaults to production
```

### Initialize

```ts
import Openfort from '@openfort/openfort-node'

const openfort = new Openfort(process.env.OPENFORT_SECRET_KEY!, {
  walletSecret: process.env.OPENFORT_WALLET_SECRET!,
  publishableKey: process.env.OPENFORT_PUBLISHABLE_KEY,
})

// Or use env vars directly (auto-detected):
// OPENFORT_SECRET_KEY, OPENFORT_WALLET_SECRET, OPENFORT_PUBLISHABLE_KEY
const openfort = new Openfort()
```

### Authentication Model

All mutating backend wallet requests (`POST`, `DELETE`, `PUT` on `/accounts/backend/*`) are authenticated with **two layers**:

1. **API Key** — Bearer token in `Authorization` header (`sk_test_...` or `sk_live_...`)
2. **Wallet Auth (X-Wallet-Auth)** — Signed with the wallet secret. The SDK generates this automatically.

The SDK handles auth generation transparently — just provide `walletSecret` at init.

> **Important**: Wallet-auth requests are **not retried** on failure. All other requests use automatic retry with exponential backoff.

---

## EVM Backend Wallets

### Create

```ts
const account = await openfort.accounts.evm.backend.create({
  wallet: 'pla_...', // Optional — associates the wallet with a player
})
// account.id       — 'acc_...'
// account.address  — '0x...' (viem Address type)
// account.walletId — 'wal_...'
// account.custody  — 'Developer'
```

### List & Get

```ts
// List all EVM backend wallets (paginated)
const { accounts, total, nextPageToken } = await openfort.accounts.evm.backend.list({
  limit: 50,  // 1-100, default 10, optional
  skip: 0,    // optional
})

// Get by ID or address
const account = await openfort.accounts.evm.backend.get({ id: 'acc_...' })
// OR
const account = await openfort.accounts.evm.backend.get({ address: '0x...' })
// Throws AccountNotFoundError if not found
```

### Send Transaction (EVM — Gasless with EIP-7702)

`sendTransaction` handles the full EIP-7702 delegation + gasless flow automatically:

1. **First call on a chain**: registers EIP-7702 delegation on-chain (upgrades EOA to smart account), then sends transaction
2. **Subsequent calls**: skips delegation, sends directly
3. **Multiple interactions** are batched atomically in a single transaction (enabled by smart account delegation)

```ts
const account = await openfort.accounts.evm.backend.create()

const result = await openfort.accounts.evm.backend.sendTransaction({
  account: account,           // Required — account object from create() or get()
  chainId: 84532,             // Required — target chain ID (resolved via viem/chains)
  interactions: [              // Required — array of contract calls (batched atomically)
    {
      to: '0xRecipientAddress',  // Required — destination address
      value: '0',                // Optional, default '0' — Wei amount as string
      data: '0x',                // Optional, default '0x' — calldata
    },
    // Add more interactions for atomic batching
  ],
  policy: 'pol_...',              // Optional — fee sponsorship ID for gasless tx
  rpcUrl: 'https://sepolia.base.org',  // Optional — custom RPC (required for chains not in viem/chains)
})

console.log('TX Hash:', result.response?.transactionHash)
console.log('Status:', result.response?.status)
console.log('Gas Used:', result.response?.gasUsed)
```

> **Note**: If `chainId` is not found in `viem/chains` and no `rpcUrl` is provided, a `DelegationError` is thrown.

### Sign Data

The account object supports multiple signing methods:

```ts
const account = await openfort.accounts.evm.backend.get({ address: '0x...' })

// Sign a raw hash (32-byte hex)
const sig1 = await account.sign({ hash: '0xabcdef...' })

// Sign a human-readable message (EIP-191 personal_sign)
const sig2 = await account.signMessage({ message: 'Hello World' })

// Sign a serializable transaction
const sig3 = await account.signTransaction({
  to: '0x...',
  value: 100n,
  chainId: 84532,
})

// Sign EIP-712 typed data
const sig4 = await account.signTypedData({
  domain: { name: 'MyApp', version: '1', chainId: 84532 },
  types: { Transfer: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }] },
  primaryType: 'Transfer',
  message: { to: '0x...', amount: 100n },
})
```

Or use the lower-level API directly:

```ts
const signature = await openfort.accounts.evm.backend.sign({
  id: account.id,
  data: '0x...',  // hex-encoded data to sign
})
```

### Update to Delegated Account (EIP-7702)

Manually register EIP-7702 delegation without sending a transaction:

```ts
const delegatedAccount = await openfort.accounts.evm.backend.update({
  walletId: account.walletId,
  accountType: 'Delegated Account', // Required for EIP-7702 upgrade
  chainId: 84532,
  implementationType: 'Calibur',
  accountId: account.id,
})
```

### Import Private Key

The SDK handles E2E encryption internally — just provide the raw private key:

```ts
const imported = await openfort.accounts.evm.backend.import({
  privateKey: '0xYourPrivateKeyHex', // hex string (with or without 0x prefix)
})
// imported.id, imported.address
```

> **Under the hood**: The SDK encrypts your private key with RSA-OAEP (SHA-256) using the server's public key before transit. The server holds the corresponding private key in a KMS HSM (non-extractable).

#### Low-level encryption helpers (advanced)

For manual encryption workflows (e.g., custom import pipelines), the SDK also exports:

```ts
import {
  generateRSAKeyPair,
  encryptForImport,
  decryptExportedPrivateKey,
  IMPORT_ENCRYPTION_PUBLIC_KEY,
} from '@openfort/openfort-node'

// These are synchronous functions:
const keyPair = generateRSAKeyPair()              // Returns { publicKey, privateKeyPem }
const encrypted = encryptForImport('0xKey', IMPORT_ENCRYPTION_PUBLIC_KEY) // Returns base64 string
const decrypted = decryptExportedPrivateKey(encryptedBase64, keyPair.privateKeyPem) // Returns hex string
```

### Export Private Key

The SDK handles E2E decryption internally — returns the private key directly:

```ts
const privateKey = await openfort.accounts.evm.backend.export({
  id: account.id,
})
// privateKey is hex string (no 0x prefix)
```

### Delete

```ts
await openfort.accounts.evm.backend.delete(account.id)
// Permanently deletes wallet and private key — irreversible
```

---

## Solana Backend Wallets

> **All Solana transactions are gasless by default** via Kora fee payer protocol. The user's wallet never needs SOL for gas. Requires `publishableKey` to be configured.

### Create

```ts
const account = await openfort.accounts.solana.backend.create({
  wallet: 'pla_...', // Optional — associates the wallet with a player
})
// account.id      — 'acc_...'
// account.address — Base58 Solana address
// account.custody — 'Developer'
```

### List & Get

```ts
const { accounts, total, nextPageToken } = await openfort.accounts.solana.backend.list({
  limit: 50,  // 1-100, default 10, optional
  skip: 0,    // optional
})

const account = await openfort.accounts.solana.backend.get({
  address: 'Base58Address...',
})
// Also: get({ id: 'acc_...' })
// Throws AccountNotFoundError if not found
```

### Transfer SOL

```ts
const result = await account.transfer({
  to: 'FDx9mfVqTvXUaSPQDELwDtGgMqxirmAFsEK2s4YsKfsc',
  amount: 1_000_000n,       // In lamports (1 SOL = 1_000_000_000 lamports)
  cluster: 'devnet',         // 'devnet' | 'mainnet-beta'
  // token defaults to 'sol'
  computeUnitLimit: 200_000,   // Optional — auto-estimated via simulation if omitted
  computeUnitPrice: 50_000n,   // Optional — micro-lamports priority fee
})
console.log('Signature:', result.signature)
```

### Transfer SPL Tokens (USDC, etc.)

```ts
// By token name
const usdcResult = await account.transfer({
  to: 'FDx9...',
  amount: 1_000_000n,  // In token base units (USDC: 6 decimals)
  token: 'usdc',
  cluster: 'devnet',
})

// By mint address
const splResult = await account.transfer({
  to: 'FDx9...',
  amount: 2_000_000n,
  token: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Mint address
  cluster: 'devnet',
})
```

### Send Transaction with Instructions

```ts
import { getTransferSolInstruction } from '@solana-program/system'
import { address, createNoopSigner } from '@solana/kit'

const account = await openfort.accounts.solana.backend.get({
  address: 'o24A5URLU3JNKg7AoeUrPsfsAo1NQeeAB4uQViAkpjq',
})

const ix = getTransferSolInstruction({
  source: createNoopSigner(address(account.address)),
  destination: address('FDx9mfVqTvXUaSPQDELwDtGgMqxirmAFsEK2s4YsKfsc'),
  amount: 10n,
})

const result = await openfort.accounts.solana.backend.sendTransaction({
  account,
  cluster: 'devnet',
  instructions: [ix],
  // computeUnitLimit — auto-estimated via simulation if omitted
  // computeUnitPrice — defaults to 50_000n micro-lamports
  // rpcUrl, wsUrl — custom endpoints (optional)
})
console.log('Signature:', result.signature)
```

**Gasless flow under the hood:**
1. Kora provides fee payer address + blockhash
2. Transaction built with Kora as fee payer
3. Compute budget auto-estimated via `simulateTransaction` (falls back to 200k CU)
4. User signs → Kora co-signs → RPC submits
5. Confirmed via WebSocket subscription (60s timeout)

### Send Raw Transaction (Pre-built Base64)

```ts
const result = await openfort.accounts.solana.backend.sendRawTransaction({
  account,
  cluster: 'devnet',
  transaction: base64EncodedTransaction,
})
// Internally decompiles, extracts instructions, re-wraps in gasless flow
```

### Sign Data (Solana)

```ts
// Lower-level API
const signature = await openfort.accounts.solana.backend.sign(
  account.id,
  'hex_encoded_data',
)

// Account object methods
const sig1 = await account.signMessage({ message: 'Hello Solana' })
const sig2 = await account.signTransaction({ transaction: base64Tx })
```

### Import / Export (Solana)

Same simplified flow as EVM — encryption is handled internally. Solana import accepts base58, hex with 0x, or raw hex. Auto-expands 32-byte seeds to 64-byte keypairs. Export returns base58 (standard Solana format).

```ts
// Import
const imported = await openfort.accounts.solana.backend.import({
  privateKey: '4YFq9y5f5hi77Bq8kDCE6VgqoAq...', // base58, hex with 0x, or raw hex
})

// Export
const privateKey = await openfort.accounts.solana.backend.export({
  id: account.id,
})
// privateKey is base58-encoded (standard Solana format)
```

---

## Gas Sponsorship (Fee Sponsorship)

Gasless transactions require a **two-step setup**: create a policy (rules), then create a fee sponsorship (strategy) linked to that policy. This can be done via the SDK or the [Openfort Dashboard](https://dashboard.openfort.io).

### Strategy Types

| Strategy | Description |
|----------|-------------|
| `pay_for_user` | Developer fully sponsors gas — user pays nothing |
| `charge_custom_tokens` | User pays in ERC-20 tokens (fixed or dynamic exchange rate) |
| `fixed_rate` | User pays a fixed token amount per transaction |

### Create via SDK (Programmatic)

```ts
// Step 1: Create a policy with criteria rules
const policy = await openfort.policies.create({
  scope: 'project',          // 'project' (all accounts) or 'account' (single account)
  description: 'Sponsor gas on Base for USDC contract',
  rules: [{
    action: 'accept',
    operation: 'sponsorEvmTransaction',
    criteria: [
      { type: 'evmNetwork', operator: 'in', chainIds: [8453] },
      { type: 'evmAddress', operator: 'in', addresses: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'] },
    ],
  }],
})

// Step 2: Create a fee sponsorship linked to that policy
const sponsorship = await openfort.feeSponsorship.create({
  name: 'Base USDC Gas Sponsorship',
  strategy: { sponsorSchema: 'pay_for_user' },
  policyId: policy.id,
})

// Step 3: Use sponsorship ID in transactions
await openfort.accounts.evm.backend.sendTransaction({
  account,
  chainId: 8453,
  interactions: [{ to: '0x...', value: '0', data: '0x...' }],
  policy: sponsorship.id,  // pol_... from sponsorship
})
```

### Create via Dashboard

1. Go to [Openfort Dashboard](https://dashboard.openfort.io) → **Policies**
2. Create a policy with your desired criteria rules
3. Go to **Fee Sponsorship** → Create and link to the policy
4. Copy the fee sponsorship ID (`pol_...`)
5. Use it in your code:

```ts
await openfort.accounts.evm.backend.sendTransaction({
  account,
  chainId: 84532,
  interactions: [{ to: '0x...', value: '0', data: '0x' }],
  policy: process.env.OPENFORT_FEE_SPONSORSHIP_ID!, // pol_... from dashboard
})
```

> **Auto-discovery**: When no explicit `policy` is passed to `sendTransaction`, project-scoped fee sponsorships are auto-discovered and the first matching one is applied.

### Fee Sponsorship CRUD

```ts
// List
const sponsorships = await openfort.feeSponsorship.list()

// Get
const sponsorship = await openfort.feeSponsorship.get('pol_...')

// Update
await openfort.feeSponsorship.update('pol_...', { name: 'New Name' })

// Enable / Disable
await openfort.feeSponsorship.disable('pol_...')
await openfort.feeSponsorship.enable('pol_...')

// Delete (soft delete)
await openfort.feeSponsorship.delete('pol_...')
```

### Charge Custom Tokens Strategy

```ts
const sponsorship = await openfort.feeSponsorship.create({
  name: 'Pay gas with USDC',
  strategy: {
    sponsorSchema: 'charge_custom_tokens',
    tokenContract: 'con_...',        // Contract ID from dashboard
    tokenContractAmount: '1000000',  // Amount in token base units
  },
  policyId: policy.id,
})
```

---

## Policy Engine

Policies define rules that control which operations are allowed or rejected. They are evaluated server-side before any signing or transaction execution.

**Key concepts:**
- **Scope**: `'project'` (all accounts) or `'account'` (single account)
- **Priority**: Higher priority policies evaluated first
- **Fail-closed**: No matching rule = operation rejected
- **Rules**: Each policy has 1-10 rules with `action` (`'accept'` | `'reject'`), `operation`, and `criteria` (AND logic)

### Create Policy

```ts
const policy = await openfort.policies.create({
  scope: 'project',
  description: 'Allow USDC transfers under 10k on Base',
  enabled: true,
  priority: 10,
  rules: [
    {
      action: 'accept',
      operation: 'sendEvmTransaction',
      criteria: [
        { type: 'evmNetwork', operator: 'in', chainIds: [8453] },
        { type: 'evmAddress', operator: 'in', addresses: ['0xUSDC_CONTRACT'] },
        { type: 'ethValue', operator: '<=', ethValue: '10000000000' },
      ],
    },
  ],
})
```

### Policy CRUD

```ts
// List policies
const policies = await openfort.policies.list({ scope: 'project', enabled: true })

// Get by ID
const policy = await openfort.policies.get('ply_...')

// Update (replaces all rules)
await openfort.policies.update('ply_...', {
  enabled: false,
  rules: [/* new rules */],
})

// Delete (soft delete)
await openfort.policies.delete('ply_...')

// Dry-run evaluation — check if an operation would be allowed without executing
const decision = await openfort.policies.evaluate({ /* operation details */ })
```

### EVM Operations & Criteria

**Operations:** `signEvmTransaction`, `sendEvmTransaction`, `signEvmTypedData`, `signEvmMessage`, `signEvmHash`, `sponsorEvmTransaction`

| Criteria Type | Operators | Fields |
|------|-----------|--------|
| `ethValue` | `<=`, `>=`, `<`, `>` | `ethValue: string` (wei) |
| `evmAddress` | `in`, `not in` | `addresses: Address[]` |
| `evmNetwork` | `in`, `not in` | `chainIds: number[]` |
| `evmData` | `in`, `not in`, `<`, `<=`, `>`, `>=`, `==`, `match` | `abi: string` (JSON ABI), `functionName: string`, `args?: Record<string, unknown>` |
| `evmMessage` | `match` | `pattern: string` (RE2 regex) |
| `evmTypedDataVerifyingContract` | `in`, `not in` | `addresses: Address[]` |
| `evmTypedDataField` | `in`, `<=`, `match` | `fieldPath: string`, `values?: string[]` (for `in`), `value?: string` (for `<=`/`match`) |

### Solana Operations & Criteria

**Operations:** `signSolTransaction`, `sendSolTransaction`, `signSolMessage`, `sponsorSolTransaction`

| Criteria Type | Operators | Fields |
|------|-----------|--------|
| `solAddress` | `in`, `not in` | `addresses: string[]` (base58) |
| `solValue` | `<=`, `>=` | `value: string` (lamports) |
| `splAddress` | `in`, `not in` | `addresses: string[]` (base58) |
| `splValue` | `<=`, `>=` | `value: string` (token units) |
| `mintAddress` | `==`, `in` | `addresses: string[]` (base58 mint addresses) |
| `programId` | `in`, `not in` | `programIds: string[]` (base58) |
| `solNetwork` | `in`, `not in` | `networks: ('mainnet-beta' \| 'devnet' \| 'testnet')[]` |
| `solMessage` | `match` | `pattern: string` (RE2 regex) |
| `solData` | `in`, `not in`, `<=`, `>=`, `==`, `match` | `idl: string` (Anchor IDL JSON), `instructionName: string`, `args?: Record<string, unknown>` |

### Validation Schemas

The SDK exports Zod schemas for client-side validation before API calls:

```ts
import {
  CreatePolicyBodySchema,
  UpdatePolicyBodySchema,
  RuleSchema,
} from '@openfort/openfort-node'

// Validate before sending
const parsed = CreatePolicyBodySchema.parse(myPolicyInput)
```

---

## Webhooks

Verify webhook signatures from Openfort using timing-safe comparison:

```ts
// In your webhook handler (e.g., Express route)
app.post('/webhook', async (req, res) => {
  const signature = req.headers['openfort-signature'] as string
  const body = req.body // raw string body

  try {
    const event = await openfort.constructWebhookEvent(body, signature)
    // event is the parsed webhook payload
    console.log('Webhook event:', event)
    res.status(200).send('OK')
  } catch (error) {
    console.error('Invalid webhook signature')
    res.status(400).send('Invalid signature')
  }
})
```

---

## Transaction Intent Flow (Legacy / Advanced)

For more control over the transaction lifecycle, use transaction intents directly:

```ts
// 1. Create transaction intent
const txIntent = await openfort.transactionIntents.create({
  chainId: 84532,
  account: 'acc_...',
  policy: 'pol_...', // Optional — fee sponsorship ID (from SDK or dashboard)
  interactions: [
    { to: '0x...', value: '0', data: '0x...' },
  ],
})

// 2. If signature needed
if (txIntent.nextAction?.payload?.signableHash) {
  const signature = await account.sign({
    hash: txIntent.nextAction.payload.signableHash,
  })

  // 3. Submit signature
  const result = await openfort.transactionIntents.signature(txIntent.id, {
    signature,
  })
  console.log('TX Hash:', result.response?.transactionHash)
}

// Estimate gas before creating
const estimate = await openfort.transactionIntents.estimateCost({
  chainId: 84532,
  interactions: [{ to: '0x...', value: '0', data: '0x...' }],
})
```

---

## Full Lifecycle Example

```ts
import Openfort from '@openfort/openfort-node'

const openfort = new Openfort(process.env.OPENFORT_SECRET_KEY!, {
  walletSecret: process.env.OPENFORT_WALLET_SECRET!,
  publishableKey: process.env.OPENFORT_PUBLISHABLE_KEY,
})

// 1. Create wallet
const wallet = await openfort.accounts.evm.backend.create()
console.log('Created:', wallet.address)

// 2. Set up gas sponsorship (policy + fee sponsorship)
const policy = await openfort.policies.create({
  scope: 'account',
  accountId: wallet.id,
  description: 'Only allow USDC on Base',
  rules: [{
    action: 'accept',
    operation: 'sponsorEvmTransaction',
    criteria: [
      { type: 'evmNetwork', operator: 'in', chainIds: [8453] },
      { type: 'evmAddress', operator: 'in', addresses: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'] },
    ],
  }],
})

const sponsorship = await openfort.feeSponsorship.create({
  name: 'USDC Escrow Sponsorship',
  strategy: { sponsorSchema: 'pay_for_user' },
  policyId: policy.id,
})

// 3. Send gasless transaction
const tx = await openfort.accounts.evm.backend.sendTransaction({
  account: wallet,
  chainId: 8453, // Base mainnet
  interactions: [{
    to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    value: '0',
    data: '0x...transfer_calldata',
  }],
  policy: sponsorship.id,
})
console.log('TX:', tx.response?.transactionHash)

// 4. Export key if needed
const pk = await openfort.accounts.evm.backend.export({ id: wallet.id })
// pk is hex string (no 0x prefix)
```

---

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
| `MissingAPIKeyError` | No API key provided at init |
| `InvalidAPIKeyFormatError` | API key doesn't match `sk_test_*` or `sk_live_*` |
| `InvalidWalletSecretFormatError` | Wallet secret is not a valid EC P-256 key |
| `InvalidPublishableKeyFormatError` | Publishable key doesn't match `pk_test_*` or `pk_live_*` |
| `UserInputValidationError` | Invalid parameters (e.g., missing viem peer dependency) |
| `TimeoutError` | Operation timed out (e.g., Solana 60s confirmation timeout) |

### API Error Classes

```ts
import {
  APIError,
  NetworkError,
  ValidationError,
  UnknownError,
} from '@openfort/openfort-node'
```

| Error | Fields | When |
|-------|--------|------|
| `APIError` | `statusCode`, `errorType`, `errorMessage`, `correlationId`, `errorLink` | HTTP error from Openfort API |
| `NetworkError` | `networkDetails` | DNS failure, timeout, IP blocked, gateway error |
| `ValidationError` | `field`, `value` | Server-side input validation failure |
| `UnknownError` | — | Unclassifiable error |

`APIError.errorType` values: `'unauthorized'`, `'forbidden'`, `'not_found'`, `'bad_request'`, `'conflict'`, `'rate_limited'`, `'bad_gateway'`, `'service_unavailable'`, `'unexpected_error'`

### Robust Error Handling Pattern

```ts
import {
  AccountNotFoundError,
  DelegationError,
  MissingWalletSecretError,
  APIError,
  NetworkError,
} from '@openfort/openfort-node'

try {
  const result = await openfort.accounts.evm.backend.sendTransaction({ ... })
} catch (error) {
  if (error instanceof AccountNotFoundError) {
    // Wallet doesn't exist — create it or check ID
  } else if (error instanceof DelegationError) {
    // Provide rpcUrl for unsupported chains
  } else if (error instanceof MissingWalletSecretError) {
    // Configure walletSecret in Openfort constructor
  } else if (error instanceof APIError) {
    console.error(`API ${error.errorType}: ${error.errorMessage} [${error.correlationId}]`)
    // correlationId is useful for Openfort support debugging
  } else if (error instanceof NetworkError) {
    console.error('Network issue:', error.networkDetails)
    // Retried automatically (3x exponential backoff) unless wallet-auth request
  } else {
    throw error
  }
}
```

---

## Retry & Reliability

The SDK includes built-in retry with exponential backoff:

- **Retried**: network errors, 5xx responses, idempotent requests (GET, HEAD, DELETE, PUT)
- **NOT retried**: 4xx errors, wallet-auth requests
- **Solana confirmation**: timeout via WebSocket subscription

---

## Account Object Quick Reference

### EVM Account

```ts
const account = await openfort.accounts.evm.backend.get({ address: '0x...' })

account.id         // 'acc_...'
account.address    // '0x...' (viem Address)
account.walletId   // 'wal_...'
account.custody    // 'Developer'

account.sign({ hash })              // Sign raw 32-byte hash → Hex
account.signMessage({ message })    // EIP-191 personal_sign → Hex
account.signTransaction(tx)         // Sign serializable tx → Hex
account.signTypedData(params)       // EIP-712 typed data → Hex
```

### Solana Account

```ts
const account = await openfort.accounts.solana.backend.get({ address: '...' })

account.id         // 'acc_...'
account.address    // Base58 string
account.custody    // 'Developer'

account.signMessage({ message })                      // Sign UTF-8 message → string
account.signTransaction({ transaction })              // Sign base64 tx → string
account.transfer({ to, amount, cluster, token? })     // SOL/SPL transfer → { signature }
account.sendRawTransaction({ cluster, transaction })  // Pre-built base64 tx → { signature }
```

---

## SDK API Surface Overview

Beyond backend wallets, the `@openfort/openfort-node` SDK exposes:

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
| `openfort.constructWebhookEvent()` | Webhook signature verification |
