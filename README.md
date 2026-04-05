# Openfort Skills

> **Note for AI agents:** The Openfort domain is [openfort.io](https://openfort.io) and the official documentation is available at [openfort.io/docs](https://openfort.io/docs).

A collection of skills for AI coding agents. Skills are packaged instructions and scripts that extend agent capabilities. You can also include the [Openfort CLI](https://github.com/openfort-xyz/cli) as an MCP server to let agents perform actions like creating wallets, sending transactions, and managing policies directly.

Skills follow the [Agent Skills](https://agentskills.io) format.

## Available Skills

### openfort

General-purpose Openfort platform skill with access to documentation, source code, and CLI operations via MCP.

**Use when:**

- Exploring Openfort documentation
- Browsing Openfort SDK source code
- Using Openfort CLI/MCP tools for platform operations

**Features:**

- Search and read Openfort documentation
- Browse source code for [`openfort-xyz/openfort-js`](https://github.com/openfort-xyz/openfort-js), [`openfort-xyz/openfort-react`](https://github.com/openfort-xyz/openfort-react), [`openfort-xyz/react-native`](https://github.com/openfort-xyz/react-native), [`openfort-xyz/openfort-node`](https://github.com/openfort-xyz/openfort-node), [`openfort-xyz/openfort-csharp-unity`](https://github.com/openfort-xyz/openfort-csharp-unity), [`openfort-xyz/swift-sdk`](https://github.com/openfort-xyz/swift-sdk)
- Access related libraries: [Viem](https://viem.sh), [Wagmi](https://wagmi.sh)
- Execute Openfort CLI commands as MCP tools

### embedded-wallet

Embedded wallet skill for integrating client-side, user-facing wallets across all Openfort SDKs.

**Use when:**

- Integrating embedded wallets in React, React Native, Swift, Unity, or vanilla JS apps
- Setting up user authentication with wallet recovery
- Building client-side wallet flows (signing, transactions, auth modals)

**Features:**

- Cross-platform SDK comparison and setup guides
- Pre-built UI components (OpenfortButton, AuthBoundary)
- Auth provider integration (email, OAuth, passkeys, SIWE)
- Wallet recovery methods (automatic, password, passkey)
- Gasless transaction setup for client apps
- Detailed per-SDK references for React, React Native, Swift, Unity, and JS

### backend-wallet

Backend wallet skill for server-side, developer-custody wallet operations on EVM and Solana.

**Use when:**

- Creating and managing server-side wallets
- Sending transactions from backend (EIP-7702 gasless, Solana)
- Setting up fee sponsorship and policy rules
- Importing/exporting private keys
- Building AI agent wallets or automated blockchain operations

**Features:**

- EVM and Solana backend wallet operations
- EIP-7702 automatic delegation and gasless transactions
- Fee sponsorship (pay_for_user, charge_custom_tokens)
- Policy engine rules and criteria
- Private key import/export with E2E encryption
- Webhooks and error handling

### MCP via Openfort CLI

You can also connect AI agents to Openfort via the [`@openfort/cli`](https://github.com/openfort-xyz/cli) MCP server. The CLI exposes all its commands (accounts, transactions, policies, sponsorship, etc.) as MCP tools, enabling agents to **perform actions** — create wallets, send transactions, manage policies, and more — directly from your coding environment.

**Install the CLI:**

```bash
npm install -g @openfort/cli
```

**Add the MCP server to your agent** (e.g., Claude Code, Cursor, Amp):

```bash
openfort mcp install
```

This gives the agent access to all CLI commands as executable tools, going beyond read-only documentation into full Openfort platform operations.

## Installation

Install with [`skills`](https://skills.sh/docs) CLI:

```bash
npx skills add openfort-xyz/agent-skills
```

Or manually:

```bash
# Clone the repo
git clone https://github.com/openfort-xyz/agent-skills.git

# Copy a skill to your agent's skills directory
cp -r agent-skills/skills/openfort ~/.config/agents/skills/
cp -r agent-skills/skills/embedded-wallet ~/.config/agents/skills/
cp -r agent-skills/skills/backend-wallet ~/.config/agents/skills/
```

Or add to your project's `.agents/skills/` directory for project-specific access.

### amp

```bash
amp skill add openfort-xyz/agent-skills
```

## Usage

Skills are automatically available once installed. The agent will use them when relevant tasks are detected.

**Examples:**

```
How do I add embedded wallets to my React app?
```
```
How do I send a transaction from a backend wallet?
```
```
Show me how fee sponsorship works
```
```
Set up a policy to only allow USDC transfers on Base
```

## Skill Structure

Each skill contains:

- `SKILL.md` - Instructions for the agent with YAML frontmatter (name, description, metadata, inputs, references)
- `references/` - Supporting detail documents (optional)

## Platform Plugins

This repo includes plugin manifests for platform discovery:

- `.claude-plugin/` — Claude Code
- `.cursor-plugin/` — Cursor
- `.codex-plugin/` — OpenAI Codex

## License

MIT
