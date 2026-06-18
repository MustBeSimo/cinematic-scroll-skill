#!/usr/bin/env node
/**
 * skill-sync.mjs — keep the per-tool SKILL.md POINTER stubs in lockstep from one source.
 *
 * .codex/ and .cursor/ ship a small pointer (NOT a copy) that redirects to the canonical
 * root SKILL.md and lists deep references. This generates both from a single template so a
 * description/reference change can't drift between tools.
 *
 *   node tools/skill-sync.mjs            # write both stubs
 *   node tools/skill-sync.mjs --check    # verify both match (exit 1 on drift) — for CI
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = [".codex/skills/cinematic-scroll/SKILL.md", ".cursor/skills/cinematic-scroll/SKILL.md"];

// Single source of truth for the stub (root-relative paths use ../../../ from the stub).
const DESCRIPTION = "Build cinematic, scroll-driven websites — pinned chapter reveals, multi-depth parallax, 3D tilt, and environment-morphing backgrounds, from a single self-contained HTML section to a full Next.js release site. The motion grammar is the constant; the aesthetic is always the user's.";

const STUB = `---
name: cinematic-scroll
description: ${DESCRIPTION}
---

# cinematic-scroll (pointer)

The \`cinematic-scroll\` skill gives an agent the taste to build cinematic,
scroll-driven websites: pinned chapters, hero/multi-depth parallax, scroll-linked
3D tilt and camera moves, and environment-morphing backgrounds — from a single
self-contained \`.html\` section (Mode A) to a full Next.js release site with
optional AI-generated visuals (Mode B). Reach for it whenever the user asks for a
scroll-driven or cinematic site, pinned/sticky sections, parallax, a product
story page, an editorial microsite, or a release/launch/drop page.

**Canonical instructions: [\`../../../SKILL.md\`](../../../SKILL.md)** — the single
source of truth. Read it in full before building. This file is only a pointer; do
not duplicate SKILL.md content.

The design contract (resolve every value through a token, never a literal):
[\`../../../design.md\`](../../../design.md) + [\`../../../tokens/\`](../../../tokens/);
11 visual systems as machine themes in [\`../../../themes/\`](../../../themes/).

Deep references (\`../../../references/\`):

- [\`scroll-patterns.md\`](../../../references/scroll-patterns.md) — 12 proven scroll patterns
- [\`film-archetypes.md\`](../../../references/film-archetypes.md) — 11 visual systems / film archetypes
- [\`component-grammar.md\`](../../../references/component-grammar.md) — named, token-driven components (Mode A + Mode B)
- [\`design-tokens.md\`](../../../references/design-tokens.md) — the DTCG token reference
- [\`performance-budget.md\`](../../../references/performance-budget.md) — transform/opacity budget + pre-launch checklist
- [\`mobile-motion.md\`](../../../references/mobile-motion.md) — mobile motion + reduced-motion degradation

Taste rules: [\`../../../taste-guardrails.md\`](../../../taste-guardrails.md).
Trigger prompts: [\`../../../examples/PROMPTS.md\`](../../../examples/PROMPTS.md).
`;

const check = process.argv.includes("--check");
let drift = 0;
for (const t of TARGETS) {
  const p = join(ROOT, t);
  const cur = existsSync(p) ? readFileSync(p, "utf8") : null;
  if (check) {
    if (cur !== STUB) { drift++; console.error(`✗ ${t} is out of sync — run \`node tools/skill-sync.mjs\``); }
  } else if (cur !== STUB) {
    writeFileSync(p, STUB);
    console.log(`↻ synced ${t}`);
  } else {
    console.log(`= ${t} already in sync`);
  }
}
if (check && drift) process.exit(1);
console.log(check ? `✓ skill-sync: ${TARGETS.length} pointer stubs in sync` : `✓ skill-sync: ${TARGETS.length} pointer stubs written`);
process.exit(0);
