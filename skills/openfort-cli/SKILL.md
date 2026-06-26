---
name: openfort-cli
description: >
  Openfort CLI skill — use for all openfort command-line operations including login, wallet
  management, transactions, policies, and configuration. This skill provides CLI command help
  and executes openfort commands directly. For embedded wallets (client-side), use the
  openfort-embedded-wallet skill. For backend wallet server operations, use the
  openfort-backend-wallet skill.
  Trigger on: "openfort CLI", "openfort login", "openfort accounts", "openfort transactions",
  or any openfort command-line operation.
license: MIT
metadata:
  author: Openfort
  version: "1.0.0"
  homepage: https://openfort.io/docs
  source: https://github.com/openfort-xyz/agent-skills
inputs:
  - name: OPENFORT_SECRET_KEY
    description: "Openfort API key for CLI authentication (run 'openfort login' to configure)"
    required: true
---

# Openfort CLI

> ⚠️ **Test keys vs. live keys.**
> `openfort login` authenticates against a single mode. Test keys (`pk_test_…` / `sk_test_…`) operate on **testnet**; live keys (`pk_live_…` / `sk_live_…`) operate on **mainnet** with real funds, and the two universes are isolated — accounts created in one cannot be used in the other.
> - Wallets created while logged in with a **test (dev) key exist only on testnet** and must **never** hold production funds.
> - For production, re-authenticate with your **live** key and create **fresh** wallets; do not reuse test wallets.
> See https://openfort.io/docs/configuration/api-keys.

You are helping a user work with Openfort — a blockchain wallet infrastructure platform that supports embedded wallets, global wallets, backend wallets, and on-chain infrastructure (bundler + paymaster) for both EVM and Solana chains.

This guide gives you the conceptual model and workflow knowledge. For executing specific CLI commands, delegate to the individual `openfort-*` skills (e.g., `/openfort-accounts-evm`, `/openfort-policies-create`).

## Core Concepts

### Wallet Types

Openfort offers three wallet products:

| Wallet Type | Who Controls It | Use Case |
|-------------|----------------|----------|
| **Embedded Wallet** | End user (self-custodial) | Consumer apps, games — users own their keys with social login, passkeys, or passwords for recovery |
| **Global Wallet** | End user (cross-app) | Ecosystem wallets shared across multiple apps via the Ecosystem SDK |
| **Backend Wallet** | Developer (server-side) | Automation, AI agents, payroll, trading bots — developer signs with API keys |

The CLI primarily manages **backend wallets**. Embedded and global wallets are managed through the SDKs (React, React Native, Swift, Unity, JavaScript).

### Account Model (Backend Wallets)

The account model has three levels, and understanding this hierarchy is critical:

```
EOA (Externally Owned Account)
  └── created with: openfort accounts evm create
  └── ID format: acc_...
  └── A standard Ethereum key pair

Delegated Account (Smart Account via EIP-7702)
  └── created with: openfort accounts evm update <eoa-id> --chainId <chain> --implementationType CaliburV9
  └── Gets its own acc_... ID (different from the EOA)
  └── Chain-specific — one delegation per chain
  └── Enables account abstraction (gasless transactions)
  └── On-chain delegation happens automatically on first transaction

Solana Account
  └── created with: openfort accounts solana create
  └── Separate key management from EVM
  └── Supports SOL, USDC, and SPL token transfers
```

### The Gas Sponsorship Stack

To enable gasless transactions, three resources must be configured:

```
Policy (ply_...)
  └── Defines WHAT is allowed (e.g., "sponsor EVM transactions on chain 84532")
  └── Has rules with criteria (chain IDs, contract addresses, operation types)

Sponsorship (pol_...)
  └── Links a Policy to a payment strategy
  └── Strategies: pay_for_user, charge_custom_tokens, fixed_rate
  └── Chain-specific

Transaction
  └── References the Sponsorship ID via --policy pol_...
  └── Gas fees are covered according to the sponsorship strategy
```

### Transaction Flow

There are two ways to send transactions:

**Recommended: `accounts evm send-transaction`** (one command does everything)
1. Takes an EOA account ID
2. Automatically finds or creates a delegated account on the target chain
3. Signs EIP-7702 authorization if needed (first transaction)
4. Creates the transaction intent
5. Signs and submits

**Advanced: Manual flow** (when you need fine-grained control)
1. Upgrade EOA to delegated: `accounts evm update`
2. Create transaction intent: `transactions create` (returns a signableHash)
3. Sign the hash: `accounts evm sign`
4. Submit signature: `transactions sign`

## Common Workflows

### First-Time Setup
1. `openfort login` — authenticate via browser
2. `openfort backend-wallet setup` — generate ECDSA P-256 signing keys
3. `openfort accounts evm create` — create your first wallet

### Send a Gasless Transaction (End-to-End)
1. Create a wallet: `openfort accounts evm create`
2. Register the target contract: `openfort contracts create --name "..." --address 0x... --chainId <chain>`
3. Create a policy: `openfort policies create --scope project --rules '[{"action":"accept","operation":"sponsorEvmTransaction","criteria":[{"type":"evmNetwork","operator":"in","chainIds":[<chain>]}]}]'`
4. Create a sponsorship: `openfort sponsorship create --policyId ply_... --strategy pay_for_user --name "..." --chainId <chain>`
5. Send: `openfort accounts evm send-transaction acc_... --chainId <chain> --interactions '[{"to":"0x...","data":"0x...","value":"0"}]' --policy pol_...`
6. Verify: `openfort transactions get <tin_id>`

### Solana Token Transfer
1. Create wallet: `openfort accounts solana create`
2. Transfer SOL: `openfort accounts solana transfer <id> --to <address> --amount <lamports> --cluster devnet`
3. Transfer USDC: `openfort accounts solana transfer <id> --to <address> --amount <amount> --token usdc --cluster mainnet-beta`
4. Transfer any SPL token: `openfort accounts solana transfer <id> --to <address> --amount <amount> --token <mint-address>`

### Set Up Webhooks
1. Create subscription: `openfort subscriptions create --topic transaction_intent.successful --triggers '[{"type":"webhook","target":"https://..."}]'`
2. Available topics: `transaction_intent.broadcast`, `transaction_intent.successful`, `transaction_intent.cancelled`, `transaction_intent.failed`, `balance.project`, `balance.contract`, `balance.dev_account`, `user.created`, `user.updated`, `user.deleted`, `account.created`, `test`

### Session Keys (Delegated Signing)
Session keys let users approve transactions for a limited time without repeated confirmations:
1. Create: `openfort sessions create --address 0x... --chainId <chain> --validAfter <unix> --validUntil <unix> --player pla_... --account acc_...`
2. Sign: `openfort sessions sign <id> --signature 0x...`
3. Revoke: `openfort sessions revoke --address 0x... --chainId <chain> --player pla_...`

## SDK Integration Points

For embedded and global wallets, the user works with SDKs rather than the CLI:

| Platform | SDK | Key Features |
|----------|-----|--------------|
| **React** | `@openfort/openfort-react` | Hooks: `useEmailAuth`, `useOAuth`, `useEthereumEmbeddedWallet`, `useSolanaEmbeddedWallet` |
| **React Native** | `@openfort/openfort-react-native` | Mobile hooks with passkey/password recovery |
| **JavaScript** | `@openfort/openfort-js` | Vanilla JS, works with Wagmi/Viem/Ethers |
| **Swift** | `OpenfortSDK` | Native iOS with Apple Sign-In, passkeys |
| **Unity** | `OpenfortSDK` | Cross-platform game integration |
| **Global Wallet** | `@openfort/ecosystem-js` | Ecosystem SDK for cross-app wallets |

### Authentication Methods (Embedded Wallets)
- Email + password
- Email OTP (passwordless)
- Phone OTP (SMS)
- Social OAuth (Google, Apple, Discord, Twitter, Facebook, LINE)
- Guest mode (try before registering)
- External wallet (SIWE)
- Third-party providers (Firebase, Supabase, Better-Auth, AccelByte, PlayFab, LootLocker)

### Recovery Methods (Embedded Wallets)
- **Automatic** — simplest, Openfort manages recovery
- **Password** — user sets a recovery password
- **Passkey** — biometric-secured via WebAuthn

## Supported Chains

Openfort supports multiple EVM chains and Solana. Common chain IDs:
- Ethereum Mainnet: 1
- Polygon: 137
- Base: 8453
- Base Sepolia (testnet): 84532
- Arbitrum: 42161
- Optimism: 10
- Solana: use `--cluster mainnet-beta` or `--cluster devnet`

## ID Formats

Understanding ID prefixes helps navigate the system:
- `acc_` — Account (wallet)
- `ply_` — Policy
- `pol_` — Sponsorship (fee policy)
- `con_` — Contract
- `tin_` — Transaction intent
- `pla_` — Player (user)
- `pro_` — Project
- `ses_` — Session
- `sub_` — Subscription

## Configuration

### Credentials
Stored at `~/.config/openfort/credentials` (or `$XDG_CONFIG_HOME/openfort/credentials`).

### Environment Variables
| Variable | Description |
|----------|-------------|
| `OPENFORT_SECRET_KEY` | Secret API key |
| `OPENFORT_WALLET_SECRET` | Wallet encryption secret |
| `OPENFORT_PUBLISHABLE_KEY` | Publishable key for client-side |
| `OPENFORT_BASE_URL` | Custom API base URL |

### Global CLI Options
`--format <toon|json|yaml|md|jsonl>`, `--filter-output <keys>`, `--verbose`, `--schema`

## Documentation Reference

For detailed documentation on specific topics, refer users to:
- Embedded wallets: https://openfort.xyz/docs/products/embedded-wallet/
- Global wallets: https://openfort.xyz/docs/products/cross-app-wallet/
- Backend wallets: https://openfort.xyz/docs/products/server/
- Infrastructure (bundler/paymaster): https://openfort.xyz/docs/products/infrastructure/
- Configuration: https://openfort.xyz/docs/configuration/
- Recipes (sample apps): https://openfort.xyz/docs/recipes/
- Policies: https://openfort.xyz/docs/configuration/policies/
- Gas sponsorship: https://openfort.xyz/docs/configuration/gas-sponsorship

## Recipes & Sample Apps

Point users to these when they're building specific integrations:
- **EIP-7702**: Next.js with embedded wallets and account delegation
- **Aave**: DeFi lending/borrowing with embedded wallets
- **Hyperliquid**: Trading with backend wallets (perpetuals, spot, HyperEVM)
- **LI.FI**: Cross-chain swaps with embedded wallets
- **Morpho**: USDC yield on Base with embedded wallets
- **Solana**: SOL transfers and gasless transactions via Kora
- **USDC**: React Native stablecoin payments
- **x402**: HTTP-based USDC micropayments
- **Agent Permissions**: Delegated DCA trading with session keys
