---
name: openfort
description: >
  Always use this skill when the user wants to explore Openfort documentation, browse SDK source
  code, or use Openfort MCP tools. This is the general-purpose Openfort platform skill — use it
  for documentation lookup, source code navigation, and CLI operations. For building with
  embedded wallets, use the openfort-embedded-wallet skill. For backend wallets, use the
  openfort-backend-wallets skill.
  Trigger on: "Openfort docs", "search Openfort", "Openfort source code", "openfort CLI",
  "MCP tools", "Openfort SDK source", or general Openfort platform questions.
license: MIT
metadata:
  author: Openfort
  version: "1.0.0"
  homepage: https://openfort.io/docs
  source: https://github.com/openfort-xyz/agent-skills
inputs:
  - name: OPENFORT_SECRET_KEY
    description: "Openfort API key for CLI authentication (run 'openfort login' to configure)"
    required: false
references:
  - mcp-tools.md
---

# Openfort

Skill for navigating Openfort documentation, browsing SDK source code, and executing platform operations via MCP tools.

> ⚠️ **Test vs. live keys.** Openfort has two isolated universes: **test mode** (`*_test_*`, testnet) and **live mode** (`*_live_*`, mainnet, real funds). Wallets/accounts created with **test (dev) keys exist only on testnet** and must **never** be used in production — go live with **live** keys and **fresh** wallets. See https://openfort.io/docs/configuration/api-keys.

## Capabilities

- Navigate Openfort documentation and SDKs
- Browse source code for openfort-xyz/openfort-js (low level typescript library), openfort-xyz/openfort-react (React TypeScript SDK), openfort-xyz/react-native (React Native SDK), openfort-xyz/node (TypeScript Node SDK), openfort-xyz/openfort-csharp-unity (Unity SDK), openfort-xyz/swift-sdk (Swift SDK)
- Access related libraries: viem, wagmi
- Execute Openfort CLI commands via MCP tools

For MCP tool details, see `references/mcp-tools.md`.

## Available Sources

- `openfort-xyz/openfort-js` – Low level TypeScript SDK
- `openfort-xyz/openfort-react` – React SDK
- `openfort-xyz/react-native` – React Native SDK
- `openfort-xyz/cli` – CLI
- `openfort-xyz/openfort-node` – Node TypeScript SDK
- `openfort-xyz/swift-sdk` – Swift SDK
- `openfort-xyz/openfort-csharp-unity` – Unity SDK
- `wevm/viem` – TypeScript Ethereum interface
- `wevm/wagmi` – React hooks for Ethereum

## Workflow

1. **Search docs first**: Use `mcp__openfort-docs__search_docs` to find relevant documentation
2. **Read pages**: Use `mcp__openfort-docs__read_page` with the page path
3. **Explore source**: Use `mcp__openfort-docs__search_source` or `mcp__openfort-docs__get_file_tree` to find implementations
4. **Read code**: Use `mcp__openfort-docs__read_source_file` to examine specific files

## Key Concepts

- **Openfort Embedded Wallets**: Give each user a wallet tied to your app with regular auth methods (EVM and Solana).
- **Openfort Backend Wallets**: Running onchain AI agents or trading bots with programmatic control. Managing app-wide funds like fees and rewards. (EVM and Solana).
- **Fee Sponsorship**: Sending transactions from wallets without requiring native chain tokens. Fully sponsor the transaction or charge custom tokens (e.g. stablecoins like USDT or USDC).
- **Policies**: set of rules and conditions that must be fulfilled. Can be applied to both fee-sponsorship or backend wallet operations.
