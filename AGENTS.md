# Instructions for AI Agents

This repository contains [Agent Skills](https://agentskills.io) for the Openfort platform.

## Repository Structure

```
skills/
├── openfort/           — General Openfort platform skill (MCP tools + docs navigation)
├── openfort-cli/       — Openfort CLI skill (command-line operations)
├── embedded-wallet/    — Embedded wallet skill (client-side wallets for React, React Native, Swift, Unity, JS)
└── backend-wallet/     — Backend wallet skill (server-side wallets for EVM and Solana)
```

## Skill Format

Each skill follows the Agent Skills standard:

- `SKILL.md` — Main skill file with YAML frontmatter (name, description, metadata, inputs, references) and markdown body
- `references/` — Supporting detail documents referenced by the SKILL.md

## Source of truth — what is hand-edited vs. generated

The per-SDK reference files are **generated from the Openfort documentation**
([openfort.io/docs](https://openfort.io/docs), source: `openfort-xyz/documentation`
→ `public/skills/`). A GitHub Action (`.github/workflows/sync-skills.yml`, via
`scripts/sync-skills.mjs`) copies them in. **Do not hand-edit the generated files** —
fix the content in the documentation repo and let the sync carry it here.

| File | Source | Edit where |
|------|--------|------------|
| `embedded-wallet/references/openfort-{js,react,react-native,swift,unity}.md` | docs `public/skills/` | **docs repo** (generated here) |
| `backend-wallet/references/setup.md` | docs `public/skills/openfort-backend-wallet-setup.md` | **docs repo** (generated here) |
| `backend-wallet/references/{evm-wallets,solana-wallets,fee-sponsorship,policy-engine}.md` | — | **this repo** (native) |
| `openfort/references/mcp-tools.md` | — | **this repo** (native) |
| all `SKILL.md` wrappers | — | **this repo** (native) |

### Editing the hand-maintained (native) files

- When editing a native `SKILL.md` or reference, preserve the YAML frontmatter structure
- When adding a new native reference file, also add it to the `references` list in the parent SKILL.md frontmatter
- Each `SKILL.md` must declare a **unique** `name` in its frontmatter
- Keep SKILL.md focused on overview, routing, and quick-start. Move detailed API docs to `references/`
- Test that frontmatter parses correctly (valid YAML between `---` delimiters)

## MCP Configuration

The MCP server config lives at the repo root in `.mcp.json` (referenced by the plugin
manifests). Individual skills do not have their own MCP configs.

## Platform Plugins

This repo includes plugin manifests for:
- `.claude-plugin/` — Claude Code
- `.cursor-plugin/` — Cursor
- `.codex-plugin/` — OpenAI Codex
