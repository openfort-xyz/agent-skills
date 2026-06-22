// Eval runner for the Openfort agent skills.
//
// For each case it generates an answer twice — once WITH the skill's SKILL.md in
// the system prompt, once WITHOUT — then has a judge model score both against the
// case's checks. The "lift" (with-skill pass rate minus baseline) is what tells
// you whether the skill is earning its place.
//
// Usage:
//   ANTHROPIC_API_KEY=sk-ant-... node run.mjs [skill-dir ...]
// With no args it runs every skill dir that contains an evals.json.
//
// Env:
//   TARGET_MODEL  model under evaluation        (default claude-opus-4-8)
//   JUDGE_MODEL   model that scores answers     (default claude-opus-4-8)

import Anthropic from "@anthropic-ai/sdk";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const TARGET_MODEL = process.env.TARGET_MODEL ?? "claude-opus-4-8";
const JUDGE_MODEL = process.env.JUDGE_MODEL ?? "claude-opus-4-8";

const client = new Anthropic();

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    checks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          check: { type: "string" },
          pass: { type: "boolean" },
          note: { type: "string" },
        },
        required: ["check", "pass", "note"],
        additionalProperties: false,
      },
    },
    overall_pass: { type: "boolean" },
  },
  required: ["checks", "overall_pass"],
  additionalProperties: false,
};

/** Generate an answer to a prompt, optionally with the skill in the system prompt. */
async function answer(prompt, skillText) {
  const res = await client.messages.create({
    model: TARGET_MODEL,
    max_tokens: 2048,
    system: skillText
      ? `You are an Openfort integration assistant. Use the following skill when relevant.\n\n${skillText}`
      : "You are a helpful coding assistant.",
    messages: [{ role: "user", content: prompt }],
  });
  return res.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/** Score an answer against a case's checks with a judge model. */
async function judge(prompt, candidate, checks) {
  const res = await client.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 2048,
    system:
      "You are a strict technical grader for Openfort SDK answers. " +
      "Evaluate the candidate answer against each check independently. " +
      "A check passes only if the answer clearly satisfies it; default to fail when uncertain.",
    output_config: { format: { type: "json_schema", schema: VERDICT_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `PROMPT:\n${prompt}\n\nCANDIDATE ANSWER:\n${candidate}\n\nCHECKS:\n${checks
          .map((c, i) => `${i + 1}. ${c}`)
          .join("\n")}\n\nReturn a verdict object.`,
      },
    ],
  });
  const text = res.content.find((b) => b.type === "text")?.text ?? "{}";
  return JSON.parse(text);
}

async function runCase(testCase, skillText) {
  const [withAns, withoutAns] = await Promise.all([
    answer(testCase.prompt, skillText),
    answer(testCase.prompt, null),
  ]);
  const [withVerdict, withoutVerdict] = await Promise.all([
    judge(testCase.prompt, withAns, testCase.checks),
    judge(testCase.prompt, withoutAns, testCase.checks),
  ]);
  return {
    id: testCase.id,
    withSkill: withVerdict.overall_pass,
    baseline: withoutVerdict.overall_pass,
    detail: withVerdict.checks,
  };
}

async function runSuite(skillDir) {
  const suite = JSON.parse(
    await readFile(join(HERE, skillDir, "evals.json"), "utf8"),
  );
  const skillText = await readFile(join(REPO, suite.skillPath), "utf8");
  console.log(`\n=== ${suite.skill} (${suite.cases.length} cases) ===`);

  const results = [];
  for (const testCase of suite.cases) {
    const r = await runCase(testCase, skillText);
    results.push(r);
    const mark = r.withSkill ? "PASS" : "FAIL";
    const base = r.baseline ? "pass" : "fail";
    console.log(`  [${mark}] ${r.id}  (baseline: ${base})`);
    for (const c of r.detail.filter((d) => !d.pass)) {
      console.log(`         ✗ ${c.check} — ${c.note}`);
    }
  }

  const withRate = results.filter((r) => r.withSkill).length / results.length;
  const baseRate = results.filter((r) => r.baseline).length / results.length;
  console.log(
    `  with-skill: ${(withRate * 100).toFixed(0)}%  baseline: ${(baseRate * 100).toFixed(0)}%  lift: ${((withRate - baseRate) * 100).toFixed(0)} pts`,
  );
  return { skill: suite.skill, withRate, baseRate };
}

async function discoverSuites() {
  const entries = await readdir(HERE, { withFileTypes: true });
  const dirs = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    try {
      await readFile(join(HERE, e.name, "evals.json"));
      dirs.push(e.name);
    } catch {
      // no evals.json in this dir — skip
    }
  }
  return dirs;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set.");
    process.exit(1);
  }
  const requested = process.argv.slice(2);
  const suites = requested.length ? requested : await discoverSuites();
  if (!suites.length) {
    console.error("No eval suites found (looked for */evals.json).");
    process.exit(1);
  }
  const summary = [];
  for (const dir of suites) summary.push(await runSuite(dir));

  console.log("\n=== summary ===");
  for (const s of summary) {
    console.log(
      `  ${s.skill}: with ${(s.withRate * 100).toFixed(0)}% / baseline ${(s.baseRate * 100).toFixed(0)}%`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
