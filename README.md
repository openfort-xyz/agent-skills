# Agent Skills

A collection of skills for AI coding agents. Skills are packaged instructions and scripts that extend agent capabilities.

Skills follow the [Agent Skills](https://agentskills.io) format.

## Available Skills

### openfort

Build applications on the Openfort network with access to documentation and source code via MCP.

**Use when:**

- Working with Openfort embedded wallets
- Integrating stablecoins or payments
- Building on the Openfort protocol
- Exploring Openfort source code

**Features:**

- Search and read Openfort documentation
- Browse source code for [`openfort-xyz/openfort-js`](https://github.com/openfort-xyz/openfort-js) (low level library),  [`openfort-xyz/openfort-react`](https://github.com/openfort-xyz/openfort-react) (TypeScript React SDK + Examples), [`openfort-xyz/react-native`](https://github.com/openfort-xyz/openfort-react) (TypeScript React SDK + Examples), [`openfort-xyz/openfort-csharp-unity`](https://github.com/openfort-xyz/openfort-csharp-unity) (Unity SDK + Example)  and [openfort-xyz/swift-sdk](https://github.com/openfort-xyz/swift-sdk)
- Access related libraries: [Viem](https://viem.sh), [Wagmi](https://wagmi.sh)

**Categories covered:**

- Smart wallets
- Embedded wallets
- Fee sponsorship

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
Show me how fee sponsorship works in Viem
```

## Skill Structure

Each skill contains:

- `SKILL.md` - Instructions for the agent
- `mcp.json` - MCP server configuration (optional)

## License

MIT
