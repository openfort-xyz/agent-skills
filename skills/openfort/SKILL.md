---
name: openfort
description: Builds applications with Openfort using TypeScript SDK, Node, React Native, Unity. Use when working with Openfort embedded wallets, backend wallets and stablecoins.
---

# Openfort

Skill for building applications with Openfort wallets.

## Capabilities

- Navigate Openfort documentation and SDKs.
- Browse source code for openfort-xyz/openfort-js (low level typescript library), openfort-xyz/openfort-react (React TypeScript SDK), openfort-xyz/react-native (React Native SDK), openfort-xyz/node (TypeScript Node SDK), openfort-xyz/openfort-csharp-unity (Unity SDK), openfort-xyz/swift-sdk (Swift SDK), 
- Access related libraries: viem, wagmi

## MCP Tools

Use these tools to explore Openfort:

| Tool                           | Description                        |
| ------------------------------ | ---------------------------------- |
| `mcp__vocs__list_pages`        | List all documentation pages       |
| `mcp__vocs__read_page`         | Read a specific documentation page |
| `mcp__vocs__search_docs`       | Search documentation               |
| `mcp__vocs__list_sources`      | List available source repositories |
| `mcp__vocs__list_source_files` | List files in a directory          |
| `mcp__vocs__read_source_file`  | Read a source code file            |
| `mcp__vocs__get_file_tree`     | Get recursive file tree            |
| `mcp__vocs__search_source`     | Search source code                 |

## Available Sources

- `openfort-xyz/openfort-js` – Low level typescript SDK
- `openfort-xyz/cli` – CLI
- `openfort-xyz/react` – React SDK
- `openfort-xyz/react-native` – React native SDK
- `openfort-xyz/swift-sdk` – Swift SDK
- `openfort-xyz/openfort-csharp-unity` – Unity SDK
- `openfort-xyz/node` – Node TypeScript SDK
- `wevm/viem` – TypeScript Ethereum interface
- `wevm/wagmi` – React hooks for Ethereum

## Workflow

1. **Search docs first**: Use `mcp__vocs__search_docs` to find relevant documentation
2. **Read pages**: Use `mcp__vocs__read_page` with the page path
3. **Explore source**: Use `mcp__vocs__search_source` or `mcp__vocs__get_file_tree` to find implementations
4. **Read code**: Use `mcp__vocs__read_source_file` to examine specific files

## Key Concepts

- **Openfort Embedded Wallets**: Give each user a wallet tied to your app with regular auth methods (EVM and Solana).
- **Openfort Backend Wallets**: Running onchain AI agents or trading bots with programmatic control. Managing app-wide funds like fees and rewards. (EVM and Solana).
- **Openfort Embedded Wallets**: Integrate invisible wallets (EVM and Solana).
- **Fee Sponsorship**: Sending transactions from wallets without requiring native chain tokens. Fully sponsor the transaction or charge custom tokens (e.g. stablecoins like USDT or USDC).
- **Policies**: set of rules and conditions that must be fulfilled. Can be applied to both fee-sponsorship or backend wallet operations.
