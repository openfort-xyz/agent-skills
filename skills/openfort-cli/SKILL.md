---
name: openfort
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
  - name: OPENFORT_API_KEY
    description: "Openfort API key for CLI authentication (run 'openfort login' to configure)"
    required: true
---

# Openfort CLI

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

Smart Account
  └── listed with: openfort accounts evm list-smart
  └── ERC-4337 smart accounts

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

## CLI Commands Reference

### login

`openfort login` — authenticate via browser and save your API key.

### backend-wallet

- `openfort backend-wallet setup` — generate and register ECDSA P-256 signing keys
- `openfort backend-wallet revoke` — revoke the current backend wallet signing secret (requires OPENFORT_WALLET_KEY_ID and OPENFORT_WALLET_SECRET)
- `openfort backend-wallet rotate` — rotate backend wallet signing secret (generates new ECDSA P-256 key pair)

### embedded-wallet

- `openfort embedded-wallet setup` — generate and register embedded wallet (Shield) API keys
  - Options: `--project <pro_...>` (optional, defaults to OPENFORT_PROJECT_ID)
  - Requires: OPENFORT_PUBLISHABLE_KEY and OPENFORT_PROJECT_ID

### accounts

- `openfort accounts list` — list all accounts across chains
  - Options: `--limit`, `--skip`, `--chainType <EVM|SVM>`, `--custody <Developer|User>`

#### accounts evm

- `openfort accounts evm create` — create a new EVM backend wallet
- `openfort accounts evm list` — list EVM backend wallets (options: `--limit`, `--skip`)
- `openfort accounts evm list-delegated` — list EVM delegated accounts (options: `--limit`, `--skip`)
- `openfort accounts evm list-smart` — list EVM smart accounts (options: `--limit`, `--skip`)
- `openfort accounts evm get <id>` — get an EVM backend wallet by ID or address
- `openfort accounts evm delete <id>` — delete an EVM backend wallet
- `openfort accounts evm update <id> --chainId <chain> --implementationType <type>` — upgrade to delegated account (EIP-7702)
- `openfort accounts evm sign <id> --data <hex>` — sign data with an EVM backend wallet
- `openfort accounts evm import --privateKey <hex>` — import a private key as an EVM backend wallet
- `openfort accounts evm export <id>` — export an EVM backend wallet private key
- `openfort accounts evm send-transaction <id> --chainId <chain> --interactions '<json>' [--policy <pol_...>]` — send a gasless EVM transaction (auto-delegates via EIP-7702 if needed)

#### accounts solana

- `openfort accounts solana create` — create a new Solana backend wallet
- `openfort accounts solana list` — list Solana backend wallets (options: `--limit`, `--skip`)
- `openfort accounts solana get <id>` — get a Solana backend wallet by ID or address
- `openfort accounts solana delete <id>` — delete a Solana backend wallet
- `openfort accounts solana sign <id> --data <base64>` — sign data with a Solana backend wallet
- `openfort accounts solana import --privateKey <hex-or-base58>` — import a Solana private key
- `openfort accounts solana export <id>` — export a Solana backend wallet private key
- `openfort accounts solana transfer <id> --to <address> --amount <lamports> [--token <sol|usdc|mint-address>] [--cluster <devnet|mainnet-beta>]` — transfer SOL or SPL tokens (cluster defaults to mainnet-beta)

### contracts

- `openfort contracts list` — list registered contracts (options: `--limit`, `--skip`)
- `openfort contracts create --name <name> --address <0x...> --chainId <chain> [--abi '<json>']` — register a smart contract
- `openfort contracts get <id>` — get a contract by ID
- `openfort contracts update <id> [--name <name>] [--address <0x...>] [--chainId <chain>] [--abi '<json>']` — update a contract
- `openfort contracts delete <id>` — delete a contract

### paymasters

- `openfort paymasters create --address <0x...> [--name <name>] [--url <url>]` — create an ERC-4337 paymaster
- `openfort paymasters get <id>` — get a paymaster by ID
- `openfort paymasters update <id> --address <0x...> [--name <name>] [--url <url>]` — update a paymaster
- `openfort paymasters delete <id>` — delete a paymaster

### policies

- `openfort policies list` — list policies (options: `--limit`, `--skip`, `--scope <project|account|transaction>`, `--enabled <true|false>`)
- `openfort policies create --scope <project|account|transaction> --rules '<json>' [--description <text>] [--priority <number>]` — create a policy with criteria-based rules
- `openfort policies get <id>` — get a policy by ID (includes rules)
- `openfort policies update <id> [--description <text>] [--enabled <true|false>] [--priority <number>] [--rules '<json>']` — update a policy
- `openfort policies delete <id>` — delete a policy
- `openfort policies evaluate --operation <operation> [--accountId <acc_...>]` — pre-flight check if an operation would be allowed

### sponsorship

- `openfort sponsorship list` — list fee sponsorships (options: `--limit`, `--skip`, `--enabled <true|false>`)
- `openfort sponsorship create --policyId <ply_...> [--strategy <pay_for_user|charge_custom_tokens|fixed_rate>] [--name <name>] [--chainId <chain>]` — create a fee sponsorship (strategy defaults to pay_for_user)
- `openfort sponsorship get <id>` — get a fee sponsorship by ID
- `openfort sponsorship update <id> [--name <name>] [--strategy <strategy>] [--policyId <ply_...>]` — update a fee sponsorship
- `openfort sponsorship enable <id>` — enable a fee sponsorship
- `openfort sponsorship disable <id>` — disable a fee sponsorship
- `openfort sponsorship delete <id>` — delete a fee sponsorship

### transactions

- `openfort transactions list` — list transaction intents (options: `--limit`, `--skip`)
- `openfort transactions create --account <acc_...> --chainId <chain> --interactions '<json>' [--policy <pol_...>] [--signedAuthorization <hex>]` — create a transaction intent
- `openfort transactions get <id>` — get a transaction intent by ID
- `openfort transactions sign <id> --signature <hex> [--optimistic]` — sign and broadcast a transaction intent
- `openfort transactions estimate --account <acc_...> --chainId <chain> --interactions '<json>' [--policy <pol_...>]` — estimate gas cost for a transaction

### sessions

- `openfort sessions list --player <pla_...>` — list session keys for a player (options: `--limit`, `--skip`)
- `openfort sessions create --address <0x...> --chainId <chain> --validAfter <unix> --validUntil <unix> [--player <pla_...>] [--account <acc_...>] [--limit <number>] [--policy <pol_...>] [--whitelist '<json-array>']` — create a session key
- `openfort sessions get <id>` — get a session key by ID
- `openfort sessions sign <id> --signature <hex> [--optimistic]` — sign and broadcast a session userOperationHash
- `openfort sessions revoke --address <0x...> --chainId <chain> [--player <pla_...>] [--policy <pol_...>]` — revoke a session key

### subscriptions

- `openfort subscriptions list` — list webhook subscriptions
- `openfort subscriptions create --topic <topic> --triggers '<json>'` — create a webhook subscription
  - Available topics: `transaction_intent.broadcast`, `transaction_intent.successful`, `transaction_intent.cancelled`, `transaction_intent.failed`, `balance.project`, `balance.contract`, `balance.dev_account`, `user.created`, `user.updated`, `user.deleted`, `account.created`, `test`
  - Trigger types: `webhook`, `email`
- `openfort subscriptions get <id>` — get a subscription by ID
- `openfort subscriptions delete <id>` — delete a subscription

#### subscriptions triggers

- `openfort subscriptions triggers list <subscriptionId>` — list triggers for a subscription
- `openfort subscriptions triggers create <subscriptionId> --target <url-or-email> [--type <webhook|email>]` — create a trigger
- `openfort subscriptions triggers get <subscriptionId> <triggerId>` — get a trigger by ID
- `openfort subscriptions triggers delete <subscriptionId> <triggerId>` — delete a trigger

### users

- `openfort users list` — list authenticated users (options: `--limit`, `--skip`, `--email <email>`, `--name <name>`)
- `openfort users get <id>` — get a user by ID (usr_...)
- `openfort users delete <id>` — delete a user

### message

- `openfort message hash <message>` — hash a message using keccak256

## Common Workflows

### First-Time Setup
1. `openfort login` — authenticate via browser
2. `openfort backend-wallet setup` — generate ECDSA P-256 signing keys
3. `openfort embedded-wallet setup` — set up embedded wallet (Shield) keys (optional)
4. `openfort accounts evm create` — create your first wallet

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

### Rotate Wallet Signing Keys
1. Rotate: `openfort backend-wallet rotate` — generates new ECDSA P-256 key pair and saves to credentials

### Estimate Gas Before Sending
1. `openfort transactions estimate --account acc_... --chainId <chain> --interactions '[{"to":"0x...","data":"0x...","value":"0"}]'`

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
- `pla_` — Player
- `usr_` — User
- `pro_` — Project
- `ses_` — Session
- `sub_` — Subscription
- `tri_` — Trigger
- `pay_` — Paymaster

## Configuration

### Credentials
Stored at `~/.config/openfort/credentials` (or `$XDG_CONFIG_HOME/openfort/credentials`, or `%APPDATA%/openfort/credentials` on Windows).

### Environment Variables
| Variable | Description |
|----------|-------------|
| `OPENFORT_API_KEY` | Secret API key (sk_test_... or sk_live_...) |
| `OPENFORT_WALLET_SECRET` | Wallet signing secret (base64-encoded ECDSA P-256 private key) |
| `OPENFORT_PUBLISHABLE_KEY` | Publishable key for client-side ops |
| `OPENFORT_BASE_URL` | Custom API base URL |
| `OPENFORT_WALLET_PUBLIC_KEY` | Wallet public key (base64-encoded) |
| `OPENFORT_WALLET_KEY_ID` | Wallet key ID (ws_...) |
| `OPENFORT_PROJECT_ID` | Project ID (pro_...) |

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
