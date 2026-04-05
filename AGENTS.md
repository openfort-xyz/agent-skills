# Instructions for AI Agents

This repository contains [Agent Skills](https://agentskills.io) for the Openfort platform.

## Repository Structure

```
skills/
├── openfort/           — General Openfort platform skill (MCP tools + docs navigation)
├── embedded-wallet/    — Embedded wallet skill (client-side wallets for React, React Native, Swift, Unity, JS)
└── backend-wallet/     — Backend wallet skill (server-side wallets for EVM and Solana)
```

## Skill Format

Each skill follows the Agent Skills standard:

- `SKILL.md` — Main skill file with YAML frontmatter (name, description, metadata, inputs, references) and markdown body
- `references/` — Supporting detail documents referenced by the SKILL.md

## Editing Guidelines

- **All skills are editable** — there is no external sync; this repo is the source of truth for agent skills
- When editing a SKILL.md, preserve the YAML frontmatter structure
- When adding a new reference file, also add it to the `references` list in the parent SKILL.md frontmatter
- Keep SKILL.md focused on overview, routing, and quick-start. Move detailed API docs to `references/`
- Test that frontmatter parses correctly (valid YAML between `---` delimiters)

## MCP Configuration

MCP server configs are at the repo root (`mcp.json` / `.mcp.json`). Individual skills do not have their own MCP configs.

## Platform Plugins

This repo includes plugin manifests for:
- `.claude-plugin/` — Claude Code
- `.cursor-plugin/` — Cursor
- `.codex-plugin/` — OpenAI Codex
