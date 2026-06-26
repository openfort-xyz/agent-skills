# EVM Backend Wallets

## Create

```ts
const account = await openfort.accounts.evm.backend.create({
  wallet: 'pla_...', // Optional — associates the wallet with a player
})
// account.id       — 'acc_...'
// account.address  — '0x...' (viem Address type)
// account.walletId — 'wal_...'
// account.custody  — 'Developer'
```

## List & Get

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

## Send Transaction (EVM — Gasless with EIP-7702)

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

## Sign Data

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

## Update to Delegated Account (EIP-7702)

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

## Import Private Key

The SDK handles E2E encryption internally — just provide the raw private key:

```ts
const imported = await openfort.accounts.evm.backend.import({
  privateKey: '0xYourPrivateKeyHex', // hex string (with or without 0x prefix)
})
// imported.id, imported.address
```

> **Under the hood**: The SDK encrypts your private key with RSA-OAEP (SHA-256) using the server's public key before transit. The server holds the corresponding private key in a KMS HSM (non-extractable).

### Low-level encryption helpers (advanced)

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

## Export Private Key

The SDK handles E2E decryption internally — returns the private key directly:

```ts
const privateKey = await openfort.accounts.evm.backend.export({
  id: account.id,
})
// privateKey is hex string (no 0x prefix)
```

## Delete

```ts
await openfort.accounts.evm.backend.delete(account.id)
// Permanently deletes wallet and private key — irreversible
```

## Account Object Quick Reference

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
```
