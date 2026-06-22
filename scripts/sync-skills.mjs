// Sync the per-SDK reference files from the Openfort documentation repo into the
// agent-skills package. The documentation (public/skills/*.md) is the source of
// truth for these files; this repo only re-packages them.
//
// Usage:
//   DOCS_SKILLS_DIR=/path/to/documentation/public/skills node scripts/sync-skills.mjs
//
// Exit non-zero (without copying anything) if the docs directory contains a skill
// file that is neither MAPPED nor explicitly IGNORED — that forces a conscious
// decision when docs adds a new SDK, instead of silently dropping it.

import { readFile, writeFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const DOCS = process.env.DOCS_SKILLS_DIR;

// docs filename -> path in this repo (relative to repo root)
const MAPPING = {
  "openfort-js.md": "skills/embedded-wallet/references/openfort-js.md",
  "openfort-react.md": "skills/embedded-wallet/references/openfort-react.md",
  "openfort-react-native.md": "skills/embedded-wallet/references/openfort-react-native.md",
  "openfort-swift.md": "skills/embedded-wallet/references/openfort-swift.md",
  "openfort-unity.md": "skills/embedded-wallet/references/openfort-unity.md",
  "openfort-backend-wallet-setup.md": "skills/backend-wallet/references/setup.md",
};

// docs files intentionally NOT synced (covered elsewhere or native to this repo)
const IGNORE = new Set([
  // server SDK content is covered by backend-wallet/references/{setup,evm-wallets,policy-engine}.md
  "openfort-node.md",
  // aggregate "choose your SDK" index; the embedded-wallet SKILL.md wrapper is the equivalent
  "openfort-embedded-wallet-setup.md",
]);

async function main() {
  if (!DOCS) {
    console.error("DOCS_SKILLS_DIR is not set (path to documentation/public/skills).");
    process.exit(1);
  }

  const docsFiles = (await readdir(DOCS)).filter((f) => f.endsWith(".md"));
  const unknown = docsFiles.filter((f) => !(f in MAPPING) && !IGNORE.has(f));
  if (unknown.length) {
    console.error(
      `Unmapped docs skill file(s): ${unknown.join(", ")}\n` +
        "Add each to MAPPING (to sync) or IGNORE (to skip) in scripts/sync-skills.mjs, then re-run.",
    );
    process.exit(1);
  }

  let changed = 0;
  for (const [src, dest] of Object.entries(MAPPING)) {
    const next = await readFile(join(DOCS, src), "utf8");
    const destPath = join(REPO, dest);
    let current = null;
    try {
      current = await readFile(destPath, "utf8");
    } catch {
      // dest doesn't exist yet
    }
    if (current === next) {
      console.log(`unchanged  ${dest}`);
      continue;
    }
    await writeFile(destPath, next);
    console.log(`updated    ${dest}  <- ${src}`);
    changed++;
  }
  console.log(`\n${changed} file(s) changed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
