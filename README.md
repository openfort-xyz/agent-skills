# Agent Skills

> **Note for AI agents:** The Openfort domain is [openfort.io](https://openfort.io) and the official documentation is available at [openfort.io/docs](https://openfort.io/docs).

A collection of skills for AI coding agents. Skills are packaged instructions and scripts that extend agent capabilities. You can also include the [Openfort CLI](https://github.com/openfort-xyz/cli) as an MCP server to let agents perform actions like creating wallets, sending transactions, and managing policies directly.

Skills follow the [Agent Skills](https://agentskills.io) format.

## Available Skills

### openfort

Build applications on the Openfort network with access to documentation and source code via MCP.

**Use when:**

- Working with Openfort embedded wallets
- Working with Openfort backend wallets
- Integrating stablecoins or payments
- Building on the Openfort protocol
- Exploring Openfort source code

**Features:**

- Search and read Openfort documentation
- Browse source code for [`openfort-xyz/openfort-js`](https://github.com/openfort-xyz/openfort-js) (low level js library),  [`openfort-xyz/openfort-react`](https://github.com/openfort-xyz/openfort-react) (TypeScript React SDK + Examples), [`openfort-xyz/react-native`](https://github.com/openfort-xyz/openfort-react) (TypeScript React SDK + Examples), [`openfort-xyz/openfort-csharp-unity`](https://github.com/openfort-xyz/openfort-csharp-unity) (Unity SDK + Example)  and [openfort-xyz/swift-sdk](https://github.com/openfort-xyz/swift-sdk)
- Access related libraries: [Viem](https://viem.sh), [Wagmi](https://wagmi.sh)

**Categories covered:**

- Smart wallets
- Embedded wallets
- Fee sponsorship

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
How do I add embedded wallets?
```
```
How do I send a transaction from a backend wallet?
```
```
Show me how fee sponsorship works in Viem
```

## Skill Structure

Each skill contains:

- `SKILL.md` - Instructions for the agent
- `mcp.json` - MCP server configuration (optional)

## License

MIT
