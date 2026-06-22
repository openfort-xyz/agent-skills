# Skill evals

Measures whether each Openfort skill actually improves an agent's answers. Every
case is run twice — once with the skill's `SKILL.md` in the system prompt, once
without — and a judge model scores both against the case's checks. The gap (the
**lift**) is the signal: a skill that doesn't move the pass rate isn't pulling its
weight.

This follows the [agentskills.io](https://agentskills.io/skill-creation/evaluating-skills)
eval model: explicit + implicit trigger prompts, negative cases, and objective,
independently-gradeable checks.

## Layout

```
skill-evals/
├── run.mjs                  # the runner
├── package.json
├── backend-wallet/evals.json
├── embedded-wallet/evals.json
├── openfort/evals.json
└── openfort-cli/evals.json
```

Each `evals.json` is:

```jsonc
{
  "skill": "openfort-backend-wallets",        // skill name (frontmatter `name`)
  "skillPath": "skills/backend-wallet/SKILL.md", // path from repo root
  "cases": [
    {
      "id": "be_create_evm_wallet",
      "prompt": "How do I create a backend EVM wallet with Openfort from Node?",
      "should_trigger": true,                  // would the skill description fire?
      "checks": [                              // objective, independently gradeable
        "Uses @openfort/openfort-node, not a client SDK",
        "Authenticates with a secret key (sk_test_/sk_live_), not a publishable key"
      ]
    }
  ]
}
```

`should_trigger: false` cases are negative tests — prompts the skill should NOT
claim to handle. Keep checks objective (a check a human could grade the same way
twice); leave subjective qualities (tone, style) out.

## Running

Requires `ANTHROPIC_API_KEY`. Each case makes 4 model calls (2 generate, 2 judge),
so a full run costs real tokens — start with one suite.

```bash
cd skill-evals
npm install
ANTHROPIC_API_KEY=sk-ant-... npm run eval:backend   # one suite
ANTHROPIC_API_KEY=sk-ant-... npm run eval            # all suites
```

Models default to `claude-opus-4-8` for both target and judge; override with
`TARGET_MODEL` / `JUDGE_MODEL`.

## Growing the suites

Start small, grow from failures: every wrong answer a user reports becomes a new
case. When a check is too brittle (passes correct answers with different wording),
loosen it; when it lets bad answers through, tighten it.
