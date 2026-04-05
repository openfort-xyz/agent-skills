# Openfort MCP Tools

## Documentation (read-only)

Use these tools to explore Openfort docs and source code:

| Tool                           | Description                        |
| ------------------------------ | ---------------------------------- |
| `mcp__openfort-docs__list_pages`        | List all documentation pages       |
| `mcp__openfort-docs__read_page`         | Read a specific documentation page |
| `mcp__openfort-docs__search_docs`       | Search documentation               |
| `mcp__openfort-docs__list_sources`      | List available source repositories |
| `mcp__openfort-docs__list_source_files` | List files in a directory          |
| `mcp__openfort-docs__read_source_file`  | Read a source code file            |
| `mcp__openfort-docs__get_file_tree`     | Get recursive file tree            |
| `mcp__openfort-docs__search_source`     | Search source code                 |

## Openfort CLI (actions)

The `@openfort/cli` MCP server exposes all CLI commands as tools, enabling the agent to perform platform operations directly — create wallets, send transactions, manage policies, sponsorship, contracts, sessions, subscriptions, and more. Requires `@openfort/cli` installed and authenticated (`openfort login`). Tool names follow the pattern `mcp__openfort__<command>` (e.g., `mcp__openfort__accounts_evm_create`).

### Install the CLI

```bash
npm install -g @openfort/cli
```

### Add the MCP server to your agent

```bash
openfort mcp install
```

This gives the agent access to all CLI commands as executable tools, going beyond read-only documentation into full Openfort platform operations.
