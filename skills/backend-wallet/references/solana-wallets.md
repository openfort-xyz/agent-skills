# Solana Backend Wallets

> **All Solana transactions are gasless by default** via Kora fee payer protocol. The user's wallet never needs SOL for gas. Requires `publishableKey` to be configured.

## Create

```ts
const account = await openfort.accounts.solana.backend.create({
  wallet: 'pla_...', // Optional — associates the wallet with a player
})
// account.id      — 'acc_...'
// account.address — Base58 Solana address
// account.custody — 'Developer'
```

## List & Get

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

## Transfer SOL

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

## Transfer SPL Tokens (USDC, etc.)

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

## Send Transaction with Instructions

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

## Send Raw Transaction (Pre-built Base64)

```ts
const result = await openfort.accounts.solana.backend.sendRawTransaction({
  account,
  cluster: 'devnet',
  transaction: base64EncodedTransaction,
})
// Internally decompiles, extracts instructions, re-wraps in gasless flow
```

## Sign Data

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

## Import / Export

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

## Account Object Quick Reference

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
