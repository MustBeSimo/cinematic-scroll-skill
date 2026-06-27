# Learn Mode — Pattern Compiler (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Phase 1 "compiler core" of Learn Mode — a disciplined pipeline that distills an authorized URL into original, reusable, IR-validated shelf entries discoverable through pointer-first canon hosts.

**Architecture:** A new sibling capability (`learn-mode.md`) reuses audit's detection pipeline (extracted to `references/detection-pipeline.md`) and runs *distillation* instead of scoring. Every observation passes through a Pattern IR gate (persisted as YAML frontmatter on each shelf entry) before being written to `references/learned/<type>/`. Four zero-dependency Node tools validate the IR, keep a projected `manifest.json` in sync, enforce bidirectional pointer integrity, and surface tag-overlap dedup candidates. CI gains real-shelf integrity (inside `check-consistency.mjs`) plus tool self-tests.

**Tech Stack:** Node ≥18 ESM (`.mjs`), zero npm dependencies (node stdlib + git only), Markdown docs, JSON manifest. Mirrors the existing `tools/*.mjs` + `cinematic-doctor --selftest` conventions.

## Global Constraints

Every task's requirements implicitly include these (verbatim from the spec):

- **Zero npm dependencies** in all tools — node stdlib only (matches `tools/check-*.mjs`).
- **No semantic model or embedding dependency in Phase 1.** Similarity is tag/keyword surfaced by tool, then judged by the agent.
- **Agent vs tool split:** CI/tools enforce *structure and integrity only*, never taste/semantic judgment.
- **Pointer-first everywhere:** full content lives ONLY on the shelf (`references/learned/`); canon files carry thin pointers; fetch on demand.
- **IR persisted as YAML frontmatter** on each shelf entry; `sync-manifest.mjs` projects it into `manifest.json`.
- **Originality firewall is operational:** no verbatim code/assets/copy/brand; `evidence.copied_material` must be `false`; every `originality_firewall.*` flag must be `true`; an entry must be re-describable without the source open.
- **`schema_version: "1.0"`** (semver string), stable **`entry_id`** separate from slug, **`status`** ∈ {candidate, accepted, merged, rejected, deprecated, promoted}.
- **No new third-party network exception** — Learn reuses audit's already-disclosed browser/fetch exception.
- **Tools run directly = CLI; imported = library.** Guard every CLI dispatch with an `isMain` check so importing a tool never executes its CLI.
- Tool output convention: collect errors, print `✓`/`✗`, `process.exit(0|1)`; `--root <dir>` overrides the tree for tests; `--selftest` proves the tool can pass *and* fail.

**Type → directory → canon-host map (used everywhere):**

| `type` | shelf dir | canon pointer host |
|---|---|---|
| `technique` | `references/learned/techniques/` | `references/scroll-patterns.md` |
| `theme` | `references/learned/themes/` | `references/visual-systems.md` |
| `archetype` | `references/learned/archetypes/` | `references/film-archetypes.md` |
| `taste-rule` | `references/learned/taste/` | `taste-guardrails.md` (repo root) |

---

### Task 1: Extract the shared detection pipeline

**Files:**
- Create: `references/detection-pipeline.md`
- Modify: `audit-mode.md` (replace the `## Detection Pipeline` section body with a pointer)

**Interfaces:**
- Produces: `references/detection-pipeline.md` — the canonical 7-category detection reference consumed by both `audit-mode.md` and (later) `learn-mode.md`.

- [ ] **Step 1: Create `references/detection-pipeline.md` by moving the detection content**

Move the entire block in `audit-mode.md` that currently sits **between** the heading `## Detection Pipeline` and the next heading `## Scoring` (the "Step 1: Scroll Interaction Detection" subsections 1.1–1.7 and "Detection Artifacts") into a new file with this header prepended:

```markdown
# Detection Pipeline — shared scroll-interaction detection

> Shared by **audit mode** (`audit-mode.md`, scores the findings) and **learn mode**
> (`learn-mode.md`, distills the findings). One detection vocabulary, two consumers.
> Observe only sites the user owns or is authorized to test — see the network note in
> `audit-mode.md` and `manifest.json` → `security.thirdPartyNetworkCalls`.

<!-- The 7 detection categories below were extracted verbatim from audit-mode.md so both
     modes share one source of truth. Do not duplicate this content back into either mode. -->

## Detection categories
```

…followed by the moved subsections (1.1 Pinned/Fixed, 1.2 Parallax, 1.3 Scroll-driven animations, 1.4 Smooth scroll, 1.5 3D transforms, 1.6 CSS animations tied to scroll, 1.7 Scroll snap) and the "Detection Artifacts" JSON block.

- [ ] **Step 2: Replace the moved section in `audit-mode.md` with a pointer**

Replace the now-empty `## Detection Pipeline` section (between that heading and `## Scoring`) with:

```markdown
## Detection Pipeline

The 7-category scroll-interaction detection lives in
[`references/detection-pipeline.md`](references/detection-pipeline.md) — shared with
**learn mode** so both run one detection vocabulary. Run those detections, then apply the
**Scoring** rubrics below to the evidence they produce.
```

- [ ] **Step 3: Verify no dead links and the move is clean**

Run: `node tools/check-links.mjs`
Expected: PASS (no dead links).

Run: `grep -c "position: sticky" references/detection-pipeline.md && grep -c "position: sticky" audit-mode.md`
Expected: `1` then `0` — the detection detail now lives only in the shared reference.

- [ ] **Step 4: Commit**

```bash
git add references/detection-pipeline.md audit-mode.md
git commit -m "refactor(learn): extract shared detection-pipeline.md from audit-mode"
```

---

### Task 2: Pattern IR schema (human doc + machine mirror)

**Files:**
- Create: `references/pattern-ir.md`
- Create: `tools/learn/lib/schema.mjs`

**Interfaces:**
- Produces (`schema.mjs`): `TYPES`, `STATUSES`, `DEDUP_ACTIONS`, `OBSERVATION_METHODS`, `COMPLEXITY`, `FIREWALL_FLAGS`, `REQUIRED` (string[] of dot-paths), `TYPE_DIR` (`{technique:"techniques",theme:"themes",archetype:"archetypes","taste-rule":"taste"}`), `TYPE_HOST` (`{technique:"references/scroll-patterns.md",…}`), `SCHEMA_VERSION` (`"1.0"`).

- [ ] **Step 1: Create `tools/learn/lib/schema.mjs`**

```js
// schema.mjs — machine mirror of references/pattern-ir.md. The .md is the human
// canon; this is the enforced shape. Keep the two in sync (a one-line comment in
// each points at the other). Zero deps; pure data.
export const SCHEMA_VERSION = "1.0";
export const TYPES = ["technique", "theme", "archetype", "taste-rule"];
export const STATUSES = ["candidate", "accepted", "merged", "rejected", "deprecated", "promoted"];
export const DEDUP_ACTIONS = ["create", "merge", "skip"];
export const OBSERVATION_METHODS = ["browser", "fetch", "screenshot", "dom", "motion-trace"];
export const COMPLEXITY = ["low", "medium", "high"];
export const FIREWALL_FLAGS = [
  "no_verbatim_code", "no_copied_assets", "no_brand_copy", "no_asset_dependency",
  "source_specific_terms_removed", "reimplemented_from_principle", "redescribable_without_source",
];
export const TYPE_DIR = { technique: "techniques", theme: "themes", archetype: "archetypes", "taste-rule": "taste" };
export const TYPE_HOST = {
  technique: "references/scroll-patterns.md",
  theme: "references/visual-systems.md",
  archetype: "references/film-archetypes.md",
  "taste-rule": "taste-guardrails.md",
};
// every required leaf (dot-path) an IR object must define:
export const REQUIRED = [
  "schema_version", "entry_id", "slug", "type", "status", "name", "source_url", "observed_date", "machine_distilled",
  "evidence.observation_method", "evidence.source_elements", "evidence.copied_material",
  "abstraction.core_mechanism", "abstraction.reusable_recipe", "abstraction.design_intent",
  "abstraction.why_it_works", "abstraction.constraints", "abstraction.failure_modes",
  ...FIREWALL_FLAGS.map((f) => `originality_firewall.${f}`),
  "applicability.best_for", "applicability.avoid_when", "applicability.compatible_buckets",
  "applicability.complexity", "applicability.tags",
  "scores.confidence", "scores.novelty", "scores.originality_risk", "scores.reuse",
  "dedup.action", "dedup.reason",
  "promotion.eligible_for_canon", "promotion.human_review_required",
];
```

- [ ] **Step 2: Verify it loads**

Run: `node -e "import('./tools/learn/lib/schema.mjs').then(m=>{if(m.REQUIRED.length>30&&m.TYPES.length===4)console.log('ok '+m.REQUIRED.length+' required');else{console.error('bad');process.exit(1)}})"`
Expected: `ok 36 required` (a number > 30).

- [ ] **Step 3: Create `references/pattern-ir.md`** (the human canon)

````markdown
# Pattern IR — the canonical schema for every learned unit

> The machine-enforced mirror is `tools/learn/lib/schema.mjs`; keep the two in sync.
> Nothing is written to `references/learned/` until it is a valid Pattern IR object.

The IR is stored as **YAML frontmatter** at the top of each shelf entry. Subset rules
(enforced by `tools/learn/lib/frontmatter.mjs`):

- 2-space-indented nested maps.
- Scalar leaves: double-quoted strings, bare strings, numbers, `true`/`false`, `null`.
- Sequences are **inline JSON arrays with double-quoted strings**: `tags: ["a","b"]` (or `[]`).
  No `- item` block sequences.
- No inline `#` comments inside entries (only full-line comments, and only in this doc's example).
- Empty-string values must be written as `""` (a key with no value opens a nested map).

```yaml
schema_version: "1.0"                  # REQUIRED, semver string
entry_id: ""                           # REQUIRED, stable, unique, SEPARATE from slug, e.g. "learned-technique-0001"
slug: ""                               # human file slug (may change; entry_id never does)
type: technique                        # technique | theme | archetype | taste-rule
status: candidate                      # candidate | accepted | merged | rejected | deprecated | promoted
name: ""
source_url: ""
observed_date: ""
machine_distilled: true
evidence:
  observation_method: browser          # browser | fetch | screenshot | dom | motion-trace
  source_elements: []                  # subset of visual|interaction|layout|copy|timing|media
  copied_material: false               # MUST be false
abstraction:
  core_mechanism: ""
  reusable_recipe: ""
  design_intent: ""
  why_it_works: ""
  constraints: ""
  failure_modes: ""
originality_firewall:
  no_verbatim_code: true
  no_copied_assets: true
  no_brand_copy: true
  no_asset_dependency: true
  source_specific_terms_removed: true
  reimplemented_from_principle: true
  redescribable_without_source: true   # the anti-imitation test
applicability:
  best_for: []
  avoid_when: []
  compatible_buckets: []
  complexity: medium                   # low | medium | high
  tags: []                             # REQUIRED non-empty; the only dedup signal in Phase 1
scores:
  confidence: 0.0                      # [0,1] — understood the pattern correctly
  novelty: 0.0                         # [0,1] — different from canon + shelf
  originality_risk: 0.0                # [0,1] — closeness to source-specific execution
  reuse: null                          # null or [0,1]; set by telemetry (Phase 2), booster only
dedup:
  nearest_existing_entries: []
  similarity_score: 0.0
  action: create                       # create | merge | skip
  reason: ""
promotion:
  eligible_for_canon: false
  cluster_id: ""
  required_cluster_size: 3
  source_diversity_required: true
  human_review_required: true
```

**Entry body (below the frontmatter) — Phase 1 mandatory sections:** `## Reusable recipe`,
`## Constraints`, `## Failure modes`, `## Negative twin — what this is NOT`, and at least one
`## Original variant`. These are agent-authored — the heart of "compiler, not scraper."
````

- [ ] **Step 4: Verify**

Run: `node tools/check-links.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add references/pattern-ir.md tools/learn/lib/schema.mjs
git commit -m "feat(learn): Pattern IR schema — human canon + machine mirror"
```

---

### Task 3: Frontmatter parser library (TDD)

**Files:**
- Create: `tools/learn/lib/frontmatter.mjs`

**Interfaces:**
- Produces: `parseFrontmatter(text) -> { data, body }` (throws on malformed), `readEntry(absPath) -> { data, body, path }`. Used by `entries.mjs`.

- [ ] **Step 1: Write the failing self-test (stub parser)**

Create `tools/learn/lib/frontmatter.mjs` with the selftest below and a STUB `parseFrontmatter` that returns `{ data: {}, body: "" }`:

```js
#!/usr/bin/env node
/* frontmatter.mjs — minimal zero-dep YAML-subset reader for Pattern IR frontmatter.
   Subset is documented in references/pattern-ir.md. NOT a general YAML parser. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function parseFrontmatter(text) { return { data: {}, body: "" }; } // STUB — replaced in Step 3
export function readEntry(absPath) { const { data, body } = parseFrontmatter(readFileSync(absPath, "utf8")); return { data, body, path: absPath }; }

function selftest() {
  const sample = [
    "---", 'schema_version: "1.0"', 'entry_id: "learned-technique-0001"', "type: technique",
    "machine_distilled: true", "evidence:", "  observation_method: browser",
    '  source_elements: ["interaction","timing"]', "  copied_material: false",
    "scores:", "  confidence: 0.8", "  reuse: null", "applicability:",
    '  tags: ["a","b"]', '  empty: ""', "---", "## body", "hello",
  ].join("\n");
  const a = (c, m) => { if (!c) { console.error(`✗ frontmatter selftest: ${m}`); process.exit(1); } };
  const { data, body } = parseFrontmatter(sample);
  a(data.schema_version === "1.0", "schema_version string");
  a(data.entry_id === "learned-technique-0001", "entry_id");
  a(data.type === "technique", "bare string");
  a(data.machine_distilled === true, "boolean");
  a(data.evidence.observation_method === "browser", "nested scalar");
  a(Array.isArray(data.evidence.source_elements) && data.evidence.source_elements.length === 2, "inline array");
  a(data.evidence.copied_material === false, "nested false");
  a(data.scores.confidence === 0.8, "number");
  a(data.scores.reuse === null, "null");
  a(Array.isArray(data.applicability.tags) && data.applicability.tags[0] === "a", "tags array");
  a(data.applicability.empty === "", "empty quoted string");
  a(body.includes("## body"), "body extracted");
  console.log("✓ frontmatter selftest: nested maps, arrays, scalars, null, body.");
  process.exit(0);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) { if (process.argv.includes("--selftest")) selftest(); else { console.error("frontmatter.mjs is a library; run --selftest."); process.exit(2); } }
```

- [ ] **Step 2: Run the self-test, verify it FAILS**

Run: `node tools/learn/lib/frontmatter.mjs --selftest`
Expected: FAIL — `✗ frontmatter selftest: schema_version string` (stub returns `{}`).

- [ ] **Step 3: Implement the parser** — replace the STUB line with:

```js
const FM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function parseScalar(raw) {
  const s = raw.trim();
  if (s === "null") return null;
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (s.startsWith("[")) { try { return JSON.parse(s); } catch { throw new Error(`invalid inline array: ${s}`); } }
  if (s.startsWith('"')) { try { return JSON.parse(s); } catch { throw new Error(`invalid quoted string: ${s}`); } }
  return s;
}

export function parseFrontmatter(text) {
  const m = text.match(FM);
  if (!m) throw new Error("no YAML frontmatter (file must start with ---)");
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    const indent = line.length - line.trimStart().length;
    const colon = line.indexOf(":");
    if (colon === -1) throw new Error(`line ${i + 1}: expected "key: value" — got "${line.trim()}"`);
    const key = line.slice(0, colon).trim();
    const rest = line.slice(colon + 1).trim();
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
    const parent = stack[stack.length - 1].obj;
    if (rest === "") { const child = {}; parent[key] = child; stack.push({ indent, obj: child }); }
    else parent[key] = parseScalar(rest);
  }
  return { data: root, body: m[2] };
}
```

(Delete the stub `export function parseFrontmatter(...) { return { data: {}, body: "" }; }` line.)

- [ ] **Step 4: Run the self-test, verify it PASSES**

Run: `node tools/learn/lib/frontmatter.mjs --selftest`
Expected: PASS — `✓ frontmatter selftest: …`.

- [ ] **Step 5: Commit**

```bash
git add tools/learn/lib/frontmatter.mjs
git commit -m "feat(learn): zero-dep frontmatter parser for Pattern IR (TDD)"
```

---

### Task 4: Shelf scaffolding, entries walker, and test fixtures

**Files:**
- Create: `tools/learn/lib/entries.mjs`
- Create: `tools/learn/lib/fixtures.mjs`
- Create: `references/learned/{techniques,themes,archetypes,taste}/.gitkeep`
- Create: `references/learned/{LEARNING-LOG.md,CLUSTERS.md,PROMOTION-PROPOSALS.md,REJECTED.md}`
- Create: `references/learned/manifest.json` (placeholder; regenerated in Task 6)

**Interfaces:**
- Consumes: `frontmatter.readEntry`, `schema.TYPE_DIR`.
- Produces (`entries.mjs`): `collectEntries(root) -> [{ type, dir, file, path, data, body }]` (walks the 4 type dirs, `.md` only).
- Produces (`fixtures.mjs`): `VALID_ENTRY_TEXT` (string), `VALID_ENTRY_ID`, `VALID_ENTRY_SLUG`, `VALID_ENTRY_NAME`, `VALID_ENTRY_TAGS`, `pointerLine({id,name,dir,slug,oneLiner}) -> string`.

- [ ] **Step 1: Create `tools/learn/lib/entries.mjs`**

```js
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { readEntry } from "./frontmatter.mjs";
import { TYPE_DIR } from "./schema.mjs";

export function collectEntries(root) {
  const out = [];
  for (const [type, dir] of Object.entries(TYPE_DIR)) {
    const d = join(root, "references", "learned", dir);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) {
      if (!f.endsWith(".md")) continue;
      const path = join(d, f);
      const { data, body } = readEntry(path);
      out.push({ type, dir, file: f, path, data, body });
    }
  }
  return out;
}
```

- [ ] **Step 2: Create `tools/learn/lib/fixtures.mjs`** (test support shared by every tool selftest)

```js
// fixtures.mjs — shared, valid Pattern IR fixture for tool selftests. NOT shipped knowledge.
export const VALID_ENTRY_ID = "learned-technique-0001";
export const VALID_ENTRY_SLUG = "scroll-synced-focal-reveal";
export const VALID_ENTRY_NAME = "Scroll-synced focal reveal";
export const VALID_ENTRY_TAGS = ["scroll-sync", "focal-reveal", "opacity"];

export const VALID_ENTRY_TEXT = `---
schema_version: "1.0"
entry_id: "${VALID_ENTRY_ID}"
slug: "${VALID_ENTRY_SLUG}"
type: technique
status: accepted
name: "${VALID_ENTRY_NAME}"
source_url: "https://example.com/owned-demo"
observed_date: "2026-06-27"
machine_distilled: true
evidence:
  observation_method: browser
  source_elements: ["interaction","timing"]
  copied_material: false
abstraction:
  core_mechanism: "Map scroll progress within a pinned range to one focal element's opacity and scale."
  reusable_recipe: "Pin the section; drive one element opacity 0->1 and scale 0.96->1 across 30-60% of the pin; transform/opacity only."
  design_intent: "Direct the eye to one subject before revealing context."
  why_it_works: "A single moving focal point reads as intentional camera work, not decoration."
  constraints: "Transform/opacity only; finish before 70% of the pin; respect reduced-motion."
  failure_modes: "Revealing many elements at once; animating filter/blur; pin under 150vh."
originality_firewall:
  no_verbatim_code: true
  no_copied_assets: true
  no_brand_copy: true
  no_asset_dependency: true
  source_specific_terms_removed: true
  reimplemented_from_principle: true
  redescribable_without_source: true
applicability:
  best_for: ["product-hero","chapter-intro"]
  avoid_when: ["dense-dashboards","text-only-pages"]
  compatible_buckets: ["technique"]
  complexity: medium
  tags: ${JSON.stringify(VALID_ENTRY_TAGS)}
scores:
  confidence: 0.8
  novelty: 0.55
  originality_risk: 0.2
  reuse: null
dedup:
  nearest_existing_entries: []
  similarity_score: 0.0
  action: create
  reason: "No existing focal-reveal technique on the shelf."
promotion:
  eligible_for_canon: false
  cluster_id: ""
  required_cluster_size: 3
  source_diversity_required: true
  human_review_required: true
---

## Reusable recipe
Pin the section over 150-400vh. Within the first 30-60% of the pin, drive a single focal
element opacity 0->1 and scale 0.96->1 (transform/opacity only).

## Constraints
Transform/opacity only; finish before 70% of the pin; provide a reduced-motion path that
shows the element statically.

## Failure modes
Revealing several elements at once; animating filter blur; pins under 150vh.

## Negative twin - what this is NOT
Not a generic fade-in-on-enter. The reveal is scrubbed by scroll position inside a pin,
not a one-shot transition on intersection.

## Original variant A
Drive opacity plus a 12px->0 translateY instead of scale, for a "rise into focus" feel.
`;

export function pointerLine({ id = VALID_ENTRY_ID, name = VALID_ENTRY_NAME, dir = "techniques", slug = VALID_ENTRY_SLUG, oneLiner = "Scrubbed single-focal reveal inside a pin." } = {}) {
  return `- **${name}** -> \`references/learned/${dir}/${slug}.md\` - ${oneLiner} <!-- learned:${id} -->`;
}
```

- [ ] **Step 3: Create the empty shelf registry files**

`references/learned/LEARNING-LOG.md`:
```markdown
# Learning Log

> Append-only. One line per learn session and per new-canon mint (threshold + notify).
> Format: `YYYY-MM-DD · <source_url> · +<n> entries (<ids>) · notes`.
```

`references/learned/CLUSTERS.md`:
```markdown
# Clusters

> Emerging groups of related learned entries that may become a new canon category.
> A cluster lists its member `entry_id`s and source domains. When it meets the bar in
> `references/promotion-rules.md`, copy it into `PROMOTION-PROPOSALS.md` for human review.
```

`references/learned/PROMOTION-PROPOSALS.md`:
```markdown
# Promotion Proposals

> Human-review buffer between `CLUSTERS.md` and canon. Each proposal: cluster id, member
> entries, source domains, proposed canon name/scope/anti-scope, and an approval checkbox.
> Canon changes only after a proposal here is approved.
```

`references/learned/REJECTED.md`:
```markdown
# Rejected

> Useful rejects, with reasons — the system learns what NOT to learn. One row per reject:
> `<candidate name> · reason (firewall | schema | duplicate | low-confidence) · source_url`.
```

- [ ] **Step 4: Create the four type dirs with `.gitkeep`**

Run:
```bash
mkdir -p references/learned/techniques references/learned/themes references/learned/archetypes references/learned/taste
touch references/learned/techniques/.gitkeep references/learned/themes/.gitkeep references/learned/archetypes/.gitkeep references/learned/taste/.gitkeep
```

- [ ] **Step 5: Create the placeholder manifest** (`references/learned/manifest.json`)

```json
{
  "schema_version": "1.0",
  "generated_by": "tools/learn/sync-manifest.mjs",
  "entries": []
}
```

- [ ] **Step 6: Verify the walker returns an empty shelf cleanly**

Run: `node -e "import('./tools/learn/lib/entries.mjs').then(m=>console.log('entries:', m.collectEntries(process.cwd()).length))"`
Expected: `entries: 0`.

- [ ] **Step 7: Commit**

```bash
git add tools/learn/lib/entries.mjs tools/learn/lib/fixtures.mjs references/learned/
git commit -m "feat(learn): shelf scaffolding, entries walker, IR test fixtures"
```

---

### Task 5: `validate-ir.mjs` — the IR gate (TDD)

**Files:**
- Create: `tools/learn/validate-ir.mjs`

**Interfaces:**
- Consumes: `entries.collectEntries`, all `schema.*`, `fixtures.VALID_ENTRY_TEXT`.
- Produces: `validateEntry(data) -> string[]`; CLI exit 0/1; flags `--root`, `--selftest`.

- [ ] **Step 1: Write the tool with a STUB validator + selftest**

Create `tools/learn/validate-ir.mjs` with everything below, but a STUB `validateEntry` that returns `[]`:

```js
#!/usr/bin/env node
/* validate-ir.mjs — the IR gate. Validates every shelf entry's frontmatter against the
   Pattern IR schema. Zero deps. Structure/integrity only — no semantic judgment. */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectEntries } from "./lib/entries.mjs";
import { TYPES, STATUSES, DEDUP_ACTIONS, OBSERVATION_METHODS, COMPLEXITY, REQUIRED, FIREWALL_FLAGS, SCHEMA_VERSION, TYPE_DIR } from "./lib/schema.mjs";
import { VALID_ENTRY_TEXT } from "./lib/fixtures.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT_DEFAULT = join(HERE, "..", "..");
const has = (o, p) => { let a = o; for (const k of p.split(".")) { if (a == null || typeof a !== "object" || !(k in a)) return false; a = a[k]; } return true; };
const get = (o, p) => p.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
const num01 = (x) => typeof x === "number" && x >= 0 && x <= 1;

export function validateEntry(data) { return []; } // STUB — replaced in Step 3

function run(root) {
  const entries = collectEntries(root);
  const errors = [];
  const seen = new Map();
  for (const en of entries) {
    for (const msg of validateEntry(en.data)) errors.push(`${en.dir}/${en.file}: ${msg}`);
    const id = en.data.entry_id;
    if (typeof id === "string" && id) {
      if (seen.has(id)) errors.push(`${en.dir}/${en.file}: duplicate entry_id "${id}" (also ${seen.get(id)})`);
      else seen.set(id, `${en.dir}/${en.file}`);
    }
    const expectDir = TYPE_DIR[en.data.type];
    if (expectDir && en.dir !== expectDir) errors.push(`${en.dir}/${en.file}: type "${en.data.type}" should live in references/learned/${expectDir}/`);
  }
  return { count: entries.length, errors };
}

function selftest() {
  const dir = mkdtempSync(join(tmpdir(), "learn-validate-"));
  try {
    const tdir = join(dir, "references/learned/techniques");
    mkdirSync(tdir, { recursive: true });
    writeFileSync(join(tdir, "valid.md"), VALID_ENTRY_TEXT);
    let r = run(dir);
    if (r.errors.length) { console.error("✗ validate-ir selftest: valid entry rejected:\n  " + r.errors.join("\n  ")); process.exit(1); }
    const bad = VALID_ENTRY_TEXT.replace("status: accepted", "status: bogus").replace("no_brand_copy: true", "no_brand_copy: false");
    writeFileSync(join(tdir, "valid.md"), bad);
    r = run(dir);
    if (r.errors.length < 2) { console.error("✗ validate-ir selftest: corrupt entry not flagged"); process.exit(1); }
    console.log("✓ validate-ir selftest: valid passes; bad status + firewall flag fail.");
  } finally { rmSync(dir, { recursive: true, force: true }); }
  process.exit(0);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const argv = process.argv.slice(2);
  const root = argv.includes("--root") ? argv[argv.indexOf("--root") + 1] : ROOT_DEFAULT;
  if (argv.includes("--selftest")) selftest();
  else {
    const { count, errors } = run(root);
    if (errors.length) { console.error(`✗ validate-ir: ${errors.length} problem(s) across ${count} entr(y/ies):`); errors.forEach((e) => console.error(`  - ${e}`)); process.exit(1); }
    console.log(`✓ validate-ir: ${count} shelf entr(y/ies) conform to the Pattern IR.`);
    process.exit(0);
  }
}
```

- [ ] **Step 2: Run the self-test, verify it FAILS**

Run: `node tools/learn/validate-ir.mjs --selftest`
Expected: FAIL — `✗ validate-ir selftest: corrupt entry not flagged` (stub returns no errors).

- [ ] **Step 3: Implement `validateEntry`** — replace the STUB line with:

```js
export function validateEntry(data) {
  const e = [];
  for (const p of REQUIRED) if (!has(data, p)) e.push(`missing field: ${p}`);
  if (has(data, "schema_version") && get(data, "schema_version") !== SCHEMA_VERSION) e.push(`schema_version must be "${SCHEMA_VERSION}"`);
  if (has(data, "type") && !TYPES.includes(get(data, "type"))) e.push(`type not in ${TYPES.join("|")}`);
  if (has(data, "status") && !STATUSES.includes(get(data, "status"))) e.push(`status not in ${STATUSES.join("|")}`);
  if (has(data, "evidence.observation_method") && !OBSERVATION_METHODS.includes(get(data, "evidence.observation_method"))) e.push(`evidence.observation_method not in ${OBSERVATION_METHODS.join("|")}`);
  if (has(data, "applicability.complexity") && !COMPLEXITY.includes(get(data, "applicability.complexity"))) e.push(`applicability.complexity not in ${COMPLEXITY.join("|")}`);
  if (has(data, "dedup.action") && !DEDUP_ACTIONS.includes(get(data, "dedup.action"))) e.push(`dedup.action not in ${DEDUP_ACTIONS.join("|")}`);
  if (has(data, "machine_distilled") && get(data, "machine_distilled") !== true) e.push("machine_distilled must be true");
  if (has(data, "evidence.copied_material") && get(data, "evidence.copied_material") !== false) e.push("evidence.copied_material must be false (originality firewall)");
  for (const f of FIREWALL_FLAGS) if (has(data, `originality_firewall.${f}`) && get(data, `originality_firewall.${f}`) !== true) e.push(`originality_firewall.${f} must be true`);
  const tags = get(data, "applicability.tags");
  if (!Array.isArray(tags) || tags.length < 1 || !tags.every((t) => typeof t === "string")) e.push("applicability.tags must be a non-empty string array");
  for (const arr of ["applicability.best_for", "applicability.avoid_when", "applicability.compatible_buckets", "evidence.source_elements"]) {
    if (has(data, arr) && !Array.isArray(get(data, arr))) e.push(`${arr} must be an array`);
  }
  for (const s of ["scores.confidence", "scores.novelty", "scores.originality_risk"]) if (has(data, s) && !num01(get(data, s))) e.push(`${s} must be a number in [0,1]`);
  if (has(data, "scores.reuse")) { const r = get(data, "scores.reuse"); if (r !== null && !num01(r)) e.push("scores.reuse must be null or a number in [0,1]"); }
  for (const s of ["entry_id", "slug", "name"]) if (has(data, s) && !(typeof get(data, s) === "string" && get(data, s).length > 0)) e.push(`${s} must be a non-empty string`);
  return e;
}
```

(Delete the stub `export function validateEntry(data) { return []; }` line.)

- [ ] **Step 4: Run the self-test, verify it PASSES; verify the real shelf passes too**

Run: `node tools/learn/validate-ir.mjs --selftest`
Expected: PASS — `✓ validate-ir selftest: …`.

Run: `node tools/learn/validate-ir.mjs`
Expected: PASS — `✓ validate-ir: 0 shelf entr(y/ies) conform…`.

- [ ] **Step 5: Commit**

```bash
git add tools/learn/validate-ir.mjs
git commit -m "feat(learn): validate-ir — the Pattern IR gate (TDD)"
```

---

### Task 6: `sync-manifest.mjs` — project IR → manifest (TDD)

**Files:**
- Create: `tools/learn/sync-manifest.mjs`
- Modify: `references/learned/manifest.json` (regenerate canonically)

**Interfaces:**
- Consumes: `entries.collectEntries`, `schema.SCHEMA_VERSION`, `fixtures.VALID_ENTRY_TEXT`.
- Produces: `buildManifest(entries) -> object`; CLI writes (or `--check` compares) `references/learned/manifest.json`; flags `--root`, `--check`, `--selftest`.

- [ ] **Step 1: Write the tool with a STUB builder + selftest**

Create `tools/learn/sync-manifest.mjs`, STUB `buildManifest` returning `{ schema_version: "1.0", generated_by: "tools/learn/sync-manifest.mjs", entries: [] }`:

```js
#!/usr/bin/env node
/* sync-manifest.mjs — project shelf-entry IR frontmatter into references/learned/manifest.json.
   Deterministic (sorted by entry_id, no timestamps). --check verifies without writing. */
import { readFileSync, writeFileSync, existsSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectEntries } from "./lib/entries.mjs";
import { SCHEMA_VERSION } from "./lib/schema.mjs";
import { VALID_ENTRY_TEXT } from "./lib/fixtures.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT_DEFAULT = join(HERE, "..", "..");
const PROJECT = ["entry_id", "slug", "type", "status", "name", "source_url", "observed_date"];

export function buildManifest(entries) { return { schema_version: SCHEMA_VERSION, generated_by: "tools/learn/sync-manifest.mjs", entries: [] }; } // STUB

const manifestPath = (root) => join(root, "references/learned/manifest.json");
const serialize = (m) => JSON.stringify(m, null, 2) + "\n";

function run(root, check) {
  const built = serialize(buildManifest(collectEntries(root)));
  const p = manifestPath(root);
  if (check) { const cur = existsSync(p) ? readFileSync(p, "utf8") : ""; return cur === built ? { ok: true } : { ok: false, msg: "manifest.json is stale — run `node tools/learn/sync-manifest.mjs`" }; }
  writeFileSync(p, built);
  return { ok: true, wrote: p };
}

function selftest() {
  const dir = mkdtempSync(join(tmpdir(), "learn-manifest-"));
  try {
    const tdir = join(dir, "references/learned/techniques");
    mkdirSync(tdir, { recursive: true });
    writeFileSync(join(tdir, "valid.md"), VALID_ENTRY_TEXT);
    run(dir, false);
    if (!run(dir, true).ok) { console.error("✗ sync-manifest selftest: --check failed right after write"); process.exit(1); }
    if (!JSON.parse(readFileSync(manifestPath(dir), "utf8")).entries.length) { console.error("✗ sync-manifest selftest: entry not projected into manifest"); process.exit(1); }
    writeFileSync(manifestPath(dir), '{"schema_version":"1.0","entries":[]}\n');
    if (run(dir, true).ok) { console.error("✗ sync-manifest selftest: stale manifest not detected"); process.exit(1); }
    console.log("✓ sync-manifest selftest: projects entries, writes deterministically, --check detects drift.");
  } finally { rmSync(dir, { recursive: true, force: true }); }
  process.exit(0);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const argv = process.argv.slice(2);
  const root = argv.includes("--root") ? argv[argv.indexOf("--root") + 1] : ROOT_DEFAULT;
  if (argv.includes("--selftest")) selftest();
  else {
    const r = run(root, argv.includes("--check"));
    if (!r.ok) { console.error(`✗ sync-manifest: ${r.msg}`); process.exit(1); }
    console.log(argv.includes("--check") ? "✓ sync-manifest: manifest.json in sync." : `✓ sync-manifest: wrote ${r.wrote}`);
    process.exit(0);
  }
}
```

- [ ] **Step 2: Run the self-test, verify it FAILS**

Run: `node tools/learn/sync-manifest.mjs --selftest`
Expected: FAIL — `✗ sync-manifest selftest: entry not projected into manifest` (stub emits empty `entries`).

- [ ] **Step 3: Implement `buildManifest`** — replace the STUB line with:

```js
export function buildManifest(entries) {
  const rows = entries.map((en) => {
    const d = en.data, row = {};
    for (const k of PROJECT) row[k] = d[k];
    row.tags = (d.applicability && d.applicability.tags) || [];
    row.scores = d.scores || {};
    row.cluster_id = (d.promotion && d.promotion.cluster_id) || "";
    row.path = `references/learned/${en.dir}/${en.file}`;
    return row;
  }).sort((a, b) => String(a.entry_id).localeCompare(String(b.entry_id)));
  return { schema_version: SCHEMA_VERSION, generated_by: "tools/learn/sync-manifest.mjs", entries: rows };
}
```

(Delete the stub `export function buildManifest(entries) { return …; }` line.)

- [ ] **Step 4: Run the self-test (PASS) and regenerate the real manifest**

Run: `node tools/learn/sync-manifest.mjs --selftest`
Expected: PASS.

Run: `node tools/learn/sync-manifest.mjs && node tools/learn/sync-manifest.mjs --check`
Expected: `✓ sync-manifest: wrote …/manifest.json` then `✓ sync-manifest: manifest.json in sync.` (empty shelf → canonical empty manifest).

- [ ] **Step 5: Commit**

```bash
git add tools/learn/sync-manifest.mjs references/learned/manifest.json
git commit -m "feat(learn): sync-manifest — deterministic IR→manifest projection (TDD)"
```

---

### Task 7: Canon pointer hosts + `check-pointers.mjs` (TDD)

**Files:**
- Create: `references/visual-systems.md`
- Modify: `references/scroll-patterns.md`, `references/film-archetypes.md`, `taste-guardrails.md` (append a `## Learned additions` section)
- Create: `tools/learn/check-pointers.mjs`

**Interfaces:**
- Consumes: `entries.collectEntries`, `schema.TYPE_HOST`, `schema.TYPE_DIR`, `fixtures.{VALID_ENTRY_TEXT,VALID_ENTRY_ID,pointerLine}`.
- Produces: CLI exit 0/1; flags `--root`, `--selftest`. Pointer format (one per line in a host's `## Learned additions` section): `- **<name>** -> \`references/learned/<dir>/<slug>.md\` - <one-liner> <!-- learned:<entry_id> -->`.

- [ ] **Step 1: Create `references/visual-systems.md`** (new canon host for learned themes)

```markdown
# Visual Systems — canon host for learned themes

> Symmetric with `scroll-patterns.md` (techniques), `film-archetypes.md` (archetypes),
> and `taste-guardrails.md` (taste rules). Full theme recipes live on the shelf
> (`references/learned/themes/`); this file holds thin pointers only. See `learn-mode.md`.

## Learned additions

<!-- pointers are appended here by learn mode; format defined in learn-mode.md -->
```

- [ ] **Step 2: Append a `## Learned additions` section to the three existing hosts**

To the END of each of `references/scroll-patterns.md`, `references/film-archetypes.md`, and `taste-guardrails.md`, append:

```markdown

## Learned additions

<!-- pointers are appended here by learn mode; full recipes live in references/learned/ -->
```

(The HTML comment intentionally avoids the literal pointer token, so the integrity checker counts zero pointers until a real one is added.)

- [ ] **Step 3: Write the tool with a STUB checker + selftest**

Create `tools/learn/check-pointers.mjs`, STUB `run` returning `{ entries: 0, pointers: 0, errors: [] }`:

```js
#!/usr/bin/env node
/* check-pointers.mjs — bidirectional integrity between the learned shelf and the canon
   "## Learned additions" pointer sections. Zero deps. */
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectEntries } from "./lib/entries.mjs";
import { TYPE_HOST, TYPE_DIR } from "./lib/schema.mjs";
import { VALID_ENTRY_TEXT, pointerLine } from "./lib/fixtures.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT_DEFAULT = join(HERE, "..", "..");
const POINTER_RE = /<!--\s*learned:(\S+?)\s*-->/;
const PATH_RE = /references\/learned\/(techniques|themes|archetypes|taste)\/([^\s`)]+\.md)/;

function pointersInHost(root, host) {
  const p = join(root, host);
  if (!existsSync(p)) return [];
  const out = [];
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const idm = line.match(POINTER_RE);
    if (!idm) continue;
    const pm = line.match(PATH_RE);
    out.push({ id: idm[1], dir: pm ? pm[1] : null, file: pm ? pm[2] : null, host });
  }
  return out;
}

export function run(root) { return { entries: 0, pointers: 0, errors: [] }; } // STUB

function selftest() {
  const dir = mkdtempSync(join(tmpdir(), "learn-pointers-"));
  try {
    mkdirSync(join(dir, "references/learned/techniques"), { recursive: true });
    writeFileSync(join(dir, "references/learned/techniques/valid.md"), VALID_ENTRY_TEXT.replace(/slug: ".*"/, 'slug: "valid"'));
    const host = join(dir, "references/scroll-patterns.md");
    writeFileSync(host, `# Scroll patterns\n\n## Learned additions\n\n${pointerLine({ slug: "valid" })}\n`);
    let r = run(dir);
    if (r.errors.length) { console.error("✗ check-pointers selftest: clean tree flagged:\n  " + r.errors.join("\n  ")); process.exit(1); }
    writeFileSync(host, `# Scroll patterns\n\n## Learned additions\n\n`);
    r = run(dir);
    if (!r.errors.some((e) => e.includes("orphan entry"))) { console.error("✗ check-pointers selftest: missing pointer not detected"); process.exit(1); }
    console.log("✓ check-pointers selftest: clean passes; missing pointer flagged.");
  } finally { rmSync(dir, { recursive: true, force: true }); }
  process.exit(0);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const argv = process.argv.slice(2);
  const root = argv.includes("--root") ? argv[argv.indexOf("--root") + 1] : ROOT_DEFAULT;
  if (argv.includes("--selftest")) selftest();
  else {
    const { entries, pointers, errors } = run(root);
    if (errors.length) { console.error(`✗ check-pointers: ${errors.length} problem(s):`); errors.forEach((e) => console.error(`  - ${e}`)); process.exit(1); }
    console.log(`✓ check-pointers: ${entries} entr(y/ies) ↔ ${pointers} pointer(s), no orphans.`);
    process.exit(0);
  }
}
```

- [ ] **Step 4: Run the self-test, verify it FAILS**

Run: `node tools/learn/check-pointers.mjs --selftest`
Expected: FAIL — `✗ check-pointers selftest: missing pointer not detected` (stub never reports orphans).

- [ ] **Step 5: Implement `run`** — replace the STUB line with:

```js
export function run(root) {
  const errors = [];
  const entries = collectEntries(root);
  const byId = new Map(entries.map((e) => [e.data.entry_id, e]));
  const pointers = [];
  for (const host of new Set(Object.values(TYPE_HOST))) pointers.push(...pointersInHost(root, host));
  for (const e of entries) {
    const host = TYPE_HOST[e.data.type];
    if (!pointers.some((p) => p.id === e.data.entry_id && p.host === host)) errors.push(`orphan entry: ${e.dir}/${e.file} (id ${e.data.entry_id}) has no pointer in ${host}`);
  }
  for (const p of pointers) {
    const e = byId.get(p.id);
    if (!e) { errors.push(`orphan pointer: ${p.host} -> learned id "${p.id}" has no shelf entry`); continue; }
    const expectDir = TYPE_DIR[e.data.type];
    if (p.dir && p.dir !== expectDir) errors.push(`pointer dir mismatch: ${p.host} -> ${p.id} points at ${p.dir}/ but entry is ${e.data.type} (expected ${expectDir}/)`);
    if (p.file && p.file !== e.file) errors.push(`pointer file mismatch: ${p.host} -> ${p.id} points at ${p.file} but entry file is ${e.file}`);
  }
  return { entries: entries.length, pointers: pointers.length, errors };
}
```

(Delete the stub `export function run(root) { return …; }` line.)

- [ ] **Step 6: Run the self-test (PASS) and the real (empty) shelf (PASS)**

Run: `node tools/learn/check-pointers.mjs --selftest`
Expected: PASS.

Run: `node tools/learn/check-pointers.mjs`
Expected: PASS — `✓ check-pointers: 0 entr(y/ies) ↔ 0 pointer(s), no orphans.`

Run: `node tools/check-links.mjs`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add references/visual-systems.md references/scroll-patterns.md references/film-archetypes.md taste-guardrails.md tools/learn/check-pointers.mjs
git commit -m "feat(learn): canon pointer hosts + bidirectional check-pointers (TDD)"
```

---

### Task 8: `surface-dedup-candidates.mjs` — tag-overlap surfacing (TDD)

**Files:**
- Create: `tools/learn/surface-dedup-candidates.mjs`

**Interfaces:**
- Consumes: `sync-manifest.buildManifest`, `entries.collectEntries`, `fixtures.VALID_ENTRY_TEXT`.
- Produces: `rankCandidates(tags, type, manifest) -> [{entry_id,name,type,shared,jaccard}]`; CLI `--tags "a,b" [--type technique] [--top N]`; flags `--root`, `--selftest`. **No embeddings — Jaccard tag overlap only.**

- [ ] **Step 1: Write the tool with a STUB ranker + selftest**

Create `tools/learn/surface-dedup-candidates.mjs`, STUB `rankCandidates` returning `[]`:

```js
#!/usr/bin/env node
/* surface-dedup-candidates.mjs — surface possible duplicates for a candidate by TAG overlap
   (Jaccard) only. NO embeddings, NO semantic model. The agent makes the create|merge|skip call. */
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildManifest } from "./sync-manifest.mjs";
import { collectEntries } from "./lib/entries.mjs";
import { VALID_ENTRY_TEXT } from "./lib/fixtures.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT_DEFAULT = join(HERE, "..", "..");

export function rankCandidates(tags, type, manifest) { return []; } // STUB

function loadManifest(root) {
  const p = join(root, "references/learned/manifest.json");
  if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8"));
  return buildManifest(collectEntries(root));
}

function selftest() {
  const dir = mkdtempSync(join(tmpdir(), "learn-dedup-"));
  try {
    mkdirSync(join(dir, "references/learned/techniques"), { recursive: true });
    writeFileSync(join(dir, "references/learned/techniques/valid.md"), VALID_ENTRY_TEXT);
    const man = loadManifest(dir);
    const hit = rankCandidates(["scroll-sync", "opacity", "parallax"], "technique", man);
    if (!hit.length || hit[0].shared.length < 2) { console.error("✗ dedup selftest: expected overlap on shared tags"); process.exit(1); }
    const miss = rankCandidates(["totally", "unrelated"], "technique", man);
    if (miss.length) { console.error("✗ dedup selftest: non-overlapping tags should surface nothing"); process.exit(1); }
    console.log("✓ surface-dedup-candidates selftest: ranks by tag overlap; ignores non-overlap.");
  } finally { rmSync(dir, { recursive: true, force: true }); }
  process.exit(0);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const argv = process.argv.slice(2);
  const arg = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : null; };
  const root = arg("root") || ROOT_DEFAULT;
  if (argv.includes("--selftest")) selftest();
  else {
    const tags = (arg("tags") || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!tags.length) { console.error('usage: --tags "a,b,c" [--type technique] [--top N]'); process.exit(2); }
    const ranked = rankCandidates(tags, arg("type"), loadManifest(root)).slice(0, Number(arg("top") || 5));
    if (!ranked.length) { console.log("No tag-overlapping entries — likely novel (agent confirms)."); process.exit(0); }
    console.log("Possible duplicates by tag overlap (agent decides create|merge|skip):");
    for (const r of ranked) console.log(`  ${r.jaccard.toFixed(2)}  ${r.entry_id}  [${r.shared.join(", ")}]  ${r.name}`);
    process.exit(0);
  }
}
```

- [ ] **Step 2: Run the self-test, verify it FAILS**

Run: `node tools/learn/surface-dedup-candidates.mjs --selftest`
Expected: FAIL — `✗ dedup selftest: expected overlap on shared tags` (stub returns `[]`).

- [ ] **Step 3: Implement `rankCandidates`** — replace the STUB line with:

```js
export function rankCandidates(tags, type, manifest) {
  const set = new Set(tags.map((t) => t.toLowerCase().trim()).filter(Boolean));
  return manifest.entries
    .filter((e) => !type || e.type === type)
    .map((e) => {
      const et = new Set((e.tags || []).map((t) => t.toLowerCase()));
      const shared = [...set].filter((t) => et.has(t));
      const union = new Set([...set, ...et]);
      return { entry_id: e.entry_id, name: e.name, type: e.type, shared, jaccard: union.size ? shared.length / union.size : 0 };
    })
    .filter((r) => r.shared.length > 0)
    .sort((a, b) => b.jaccard - a.jaccard);
}
```

(Delete the stub `export function rankCandidates(...) { return []; }` line.)

- [ ] **Step 4: Run the self-test, verify it PASSES**

Run: `node tools/learn/surface-dedup-candidates.mjs --selftest`
Expected: PASS — `✓ surface-dedup-candidates selftest: …`.

- [ ] **Step 5: Commit**

```bash
git add tools/learn/surface-dedup-candidates.mjs
git commit -m "feat(learn): surface-dedup-candidates — tag-overlap surfacing, no embeddings (TDD)"
```

---

### Task 9: Capability docs — `learn-mode.md`, `learning-rubric.md`, `promotion-rules.md`

**Files:**
- Create: `learn-mode.md` (repo root, sibling of `audit-mode.md`)
- Create: `references/learning-rubric.md`
- Create: `references/promotion-rules.md`

**Interfaces:**
- Consumes (by reference): `references/detection-pipeline.md`, `references/pattern-ir.md`, the four tools, the canon hosts.
- Produces: the agent-facing procedure that ties the tools together.

- [ ] **Step 1: Create `learn-mode.md`**

````markdown
# Learn Mode — the Pattern Compiler

> **Activation:** the user asks to *learn from / study / distill patterns from* a URL.
> Sibling to `audit-mode.md`: audit **scores** a site, learn **distills** it into reusable,
> original, IR-validated knowledge on the shelf (`references/learned/`).

> [!WARNING]
> **Learn mode observes a URL via the agent's own browser/fetch — the SAME already-disclosed
> exception as audit mode (`manifest.json` → `security.thirdPartyNetworkCalls`); no new network
> exception is added.** Only study sites the user owns or is authorized to study. Confirm an
> allowlisted domain before observing. Never capture PII/credentials/private content. Note
> robots/ToS in the session log.

## What it produces

For one session: one or more **shelf entries** (full content, IR frontmatter), a thin
**pointer** in each entry's canon host, an append to `references/learned/LEARNING-LOG.md`, and —
when a cluster qualifies — a **promotion proposal** (never an automatic canon change).

## The originality firewall (operational, not policy)

Every candidate must pass before it is written. Distill the **abstract recipe**, never the
source's execution:

- No verbatim code, assets, copy, or brand naming.
- `evidence.copied_material: false`; every `originality_firewall.*` flag `true`.
- **Anti-imitation test:** the entry must be re-describable and re-implementable with the
  source closed (`redescribable_without_source: true`).

A candidate that fails the firewall is logged to `references/learned/REJECTED.md` (reason
`firewall`) and never written to the shelf.

## Pipeline

1. **Observe** the authorized URL using the shared detection vocabulary in
   [`references/detection-pipeline.md`](references/detection-pipeline.md).
2. **Extract candidates** across the four buckets: `technique`, `theme`, `archetype`, `taste-rule`.
3. **Author a Pattern IR** per candidate — schema: [`references/pattern-ir.md`](references/pattern-ir.md).
4. **Run the originality firewall** (above).
5. **Dedup:** surface candidates with
   `node tools/learn/surface-dedup-candidates.mjs --tags "<tags>" --type <type>`, then judge:
   - `create` → new entry;
   - `merge` → fold into the nearest existing entry (candidate `status: merged`, no new file);
   - `skip` → duplicate; log to `REJECTED.md` (reason `duplicate`), `status: rejected`.
   Always record `dedup.action` + `dedup.reason`.
6. **Score** `confidence`, `novelty`, `originality_risk` per [`references/learning-rubric.md`](references/learning-rubric.md) (`reuse` stays `null` in Phase 1).
7. **Gate:** write the entry file, then run `node tools/learn/validate-ir.mjs`. If it fails,
   fix the IR or reject it (reason `schema`); nothing invalid stays on the shelf.
8. **Write the entry** to `references/learned/<dir>/<slug>.md` (`status: accepted`) with the
   mandatory body sections (recipe, constraints, failure modes, **negative twin**, ≥1 **original variant**).
9. **Inject the pointer** into the canon host (exact format below).
10. **Sync + log:** `node tools/learn/sync-manifest.mjs`; append a line to `LEARNING-LOG.md`.
11. **Cluster:** if the entry joins an emerging group, update `references/learned/CLUSTERS.md`.
12. **Propose, never auto-promote:** see [`references/promotion-rules.md`](references/promotion-rules.md).

## Pointer format

In the host's `## Learned additions` section, one line:

```
- **<name>** -> `references/learned/<dir>/<slug>.md` - <one-liner> <!-- learned:<entry_id> -->
```

Host map: `technique`→`references/scroll-patterns.md` · `theme`→`references/visual-systems.md` ·
`archetype`→`references/film-archetypes.md` · `taste-rule`→`taste-guardrails.md`.

## Build-time retrieval

When building, scan the `## Learned additions` sections of the canon hosts and **fetch the full
`references/learned/<type>/<slug>.md` entry on demand** — pointer-first, loaded only when relevant.

## Verify

```
node tools/learn/validate-ir.mjs      # IR gate (real shelf)
node tools/learn/check-pointers.mjs   # bidirectional pointer integrity
node tools/learn/sync-manifest.mjs --check
npm run learn:selftest                # all four tools can pass AND fail
```
````

- [ ] **Step 2: Create `references/learning-rubric.md`**

```markdown
# Learning Rubric — scores + abstraction tests

The agent assigns these (no model/embedding dependency in Phase 1). All scores are `[0,1]`.

| Score | Question | High means | Low means |
|---|---|---|---|
| `confidence` | Did I understand the mechanism correctly? | mechanism is clear and verified in-page | guessed from a screenshot |
| `novelty` | How different from canon + shelf? | nothing comparable exists | near-duplicate of an existing entry |
| `originality_risk` | How close to source-specific execution? | fully abstracted, principle-level | smells like the source's exact build |
| `reuse` | Telemetry (Phase 2) | — | stays `null` in Phase 1 |

**Abstraction tests (must all hold to write an entry):**

1. **Re-describable without source** — explain the recipe with the tab closed.
2. **Re-implementable from principle** — a fresh build, not a transcription.
3. **No source fingerprints** — no brand names, class names, copy, or asset URLs.
4. **Generalizes** — `applicability.best_for` lists contexts beyond the source.

A high `originality_risk` (≳0.6) means abstract further or reject (reason `firewall`).
```

- [ ] **Step 3: Create `references/promotion-rules.md`**

```markdown
# Promotion Rules — shelf → canon

Flow: `CLUSTERS.md` (emerging groups) → `PROMOTION-PROPOSALS.md` (human-review buffer) → canon.

A cluster may be **proposed** for a new canon category only when **all** hold:

1. ≥ 3 related entries.
2. Sources span ≥ 2 distinct domains (source diversity — stops single-trend "soup").
3. Not already covered by an existing canon bucket.
4. A clear name, scope, anti-scope, and examples.
5. **Human approval** of the proposal in `PROMOTION-PROPOSALS.md`.
6. *(Phase 3)* ≥ 1 reuse recorded — a **booster/tie-breaker** in Phase 1–2, a hard gate from Phase 3.

New canon files are **pointer-first** (full content stays on the shelf), are registered in
`SKILL.md`, and the mint is logged to `LEARNING-LOG.md` (threshold + notify). Promotion is never
automatic — Phase 1 performs it only after the human approves the proposal.
```

- [ ] **Step 4: Verify links + required anchors**

Run: `node tools/check-links.mjs`
Expected: PASS.

Run: `grep -c "surface-dedup-candidates.mjs" learn-mode.md && grep -c "PROMOTION-PROPOSALS" references/promotion-rules.md && grep -c "redescribable_without_source" references/learning-rubric.md`
Expected: each ≥ `1`.

- [ ] **Step 5: Commit**

```bash
git add learn-mode.md references/learning-rubric.md references/promotion-rules.md
git commit -m "docs(learn): learn-mode pipeline + learning rubric + promotion rules"
```

---

### Task 10: Wire into packaging, CI, consistency, SKILL.md, manifest

**Files:**
- Modify: `package.json` (scripts + `files`)
- Modify: `bin/install.mjs` (PAYLOAD)
- Modify: `tools/check-consistency.mjs` (key paths + installer surface + real-shelf integrity)
- Modify: `.github/workflows/ci.yml` (self-test step)
- Modify: `SKILL.md` (activation + routing + retrieval line)
- Modify: `manifest.json` (mirror `audit-mode.md`; extend network note)

**Interfaces:**
- Consumes: every tool from Tasks 5–8 and every doc from Tasks 1–9.

- [ ] **Step 1: `package.json` — add scripts and ship `learn-mode.md`**

In `"files"`, add `"learn-mode.md",` immediately after `"audit-mode.md",`.

In `"scripts"`, add:
```json
"learn:validate": "node tools/learn/validate-ir.mjs",
"learn:pointers": "node tools/learn/check-pointers.mjs",
"learn:manifest:check": "node tools/learn/sync-manifest.mjs --check",
"learn:selftest": "node tools/learn/lib/frontmatter.mjs --selftest && node tools/learn/validate-ir.mjs --selftest && node tools/learn/sync-manifest.mjs --selftest && node tools/learn/check-pointers.mjs --selftest && node tools/learn/surface-dedup-candidates.mjs --selftest",
```
Change the `"test"` script to insert `&& npm run learn:selftest` right after `&& npm run consistency:check`:
```json
"test": "npm run tokens:check && npm run themes:check && npm run links:check && npm run consistency:check && npm run learn:selftest && npm run skill:sync:check && npm run components:doctor && npm run doctor:selftest && npm run evals:run",
```

- [ ] **Step 2: `bin/install.mjs` — ship `learn-mode.md` in the payload**

In the `PAYLOAD` array, add `'learn-mode.md',` immediately after the `'audit-mode.md',` line.

- [ ] **Step 3: `tools/check-consistency.mjs` — key paths, installer surface, real-shelf integrity**

In the section-3 key-paths array (the `for (const p of [...])` list), add these entries:
```js
"learn-mode.md", "references/detection-pipeline.md", "references/pattern-ir.md",
"references/learning-rubric.md", "references/promotion-rules.md", "references/visual-systems.md",
"references/learned/manifest.json", "references/learned/LEARNING-LOG.md",
"references/learned/CLUSTERS.md", "references/learned/PROMOTION-PROPOSALS.md",
"references/learned/REJECTED.md",
```
In the section-3b installer-surface list (`for (const surface of [...])`), add `"learn-mode.md"`.

Add a new block immediately before the final `if (errors.length) {` report:
```js
// 5. learned-shelf integrity (real shelf): IR schema, pointer↔shelf, manifest in sync
for (const [label, toolArgs] of [
  ["validate-ir", ["tools/learn/validate-ir.mjs"]],
  ["check-pointers", ["tools/learn/check-pointers.mjs"]],
  ["sync-manifest --check", ["tools/learn/sync-manifest.mjs", "--check"]],
]) {
  const r = spawnSync(process.execPath, [join(ROOT, toolArgs[0]), ...toolArgs.slice(1)], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) errors.push(`learned-shelf: ${label} failed — ${((r.stderr || r.stdout) || "").trim().split("\n").pop()}`);
}
```

- [ ] **Step 4: `.github/workflows/ci.yml` — add a self-test step**

In the `craft-contract` job, immediately after the `Consistency (version / secrets / token determinism)` step, add:
```yaml
      - name: Learn tools self-test
        run: npm run learn:selftest
```

- [ ] **Step 5: `SKILL.md` — activation, routing, retrieval**

(a) In the activation comment block, change the line
`# OR asks to review or score an existing URL's scroll experience.`
to:
```
# OR asks to review or score an existing URL's scroll experience,
# OR asks to LEARN FROM / study / distill patterns from an existing URL.
```

(b) In the "Route the request" table, add a row immediately after the audit-mode row (the one whose "Read first" is `audit-mode.md`):
```
| "learn from / study / distill patterns from an existing URL" | **Learn mode**: study a user-authorized URL and distill reusable recipes (technique / visual system / archetype / taste rule) onto the learned shelf via the Pattern IR gate — never copying code/assets/brand. | `learn-mode.md` |
```

(c) Immediately after the `## Agent quickstart` block's section **1b** (the paragraph ending `Full reference: \`references/design-tokens.md\`.` … through the component-grammar sentence), add a new paragraph:
```
**1c · Reuse what the skill has learned.** Before building, scan the `## Learned additions`
pointer sections of `references/scroll-patterns.md`, `references/visual-systems.md`,
`references/film-archetypes.md`, and `taste-guardrails.md`, and fetch any relevant
`references/learned/<type>/<slug>.md` entry on demand (pointer-first, loaded only when
relevant). These are distilled, original recipes the skill learned from authorized sites.
To add to them, see `learn-mode.md`.
```

- [ ] **Step 6: `manifest.json` — mirror audit-mode + extend the network note**

Open `manifest.json`. Wherever `audit-mode.md` is listed as a file/doc entry, add a sibling
entry `learn-mode.md` of the same shape. In `security.thirdPartyNetworkCalls`, extend the audit
browser/fetch description to add: `Learn mode uses this same browser/fetch access to observe
user-authorized URLs; no additional network exception is introduced.` Keep the JSON valid.

- [ ] **Step 7: Run the full gate**

Run: `npm test`
Expected: PASS end-to-end — including `✓ check-consistency …`, the `learn:selftest` chain (five `✓` lines), and no dead links.

Run: `node tools/check-consistency.mjs`
Expected: PASS — version quad in sync, foundation paths present (incl. the new learn paths), learned-shelf integrity green.

- [ ] **Step 8: Manual acceptance — one real learn run (documented, not CI)**

Following `learn-mode.md`, run Learn against a URL the user owns or is authorized to study.
Confirm: ≥1 entry written to `references/learned/<type>/`, its IR passes `node tools/learn/validate-ir.mjs`,
its pointer passes `node tools/learn/check-pointers.mjs`, `sync-manifest` updates `manifest.json`,
and a `LEARNING-LOG.md` line was appended. Then re-run `npm test` (still green). Revert the demo
entry if it should not ship, or keep it as the first real shelf entry.

- [ ] **Step 9: Commit**

```bash
git add package.json bin/install.mjs tools/check-consistency.mjs .github/workflows/ci.yml SKILL.md manifest.json references/learned/manifest.json
git commit -m "feat(learn): wire Learn mode into packaging, CI, consistency, SKILL.md, manifest"
```

---

## Self-Review

**1. Spec coverage** (Phase 1 row + success criteria):

| Spec item | Task |
|---|---|
| IR gate + `pattern-ir.md` | 2, 5 |
| `learn-mode.md` | 9 |
| extracted `detection-pipeline.md` (audit refactored) | 1 |
| shelf + per-recipe entries (IR + recipe + negative twin + variant) | 4 (scaffold + fixture body), 9 (authoring rules) |
| 4 canon pointer hosts incl. new `visual-systems.md` | 7 |
| firewall + `learning-rubric.md` | 9 (firewall in learn-mode, rubric doc), 5 (firewall flags enforced) |
| tag/keyword dedup only — no embeddings | 8 |
| `promotion-rules.md` (manual, human-approved) | 9 |
| `manifest.json` | 4, 6 |
| `LEARNING-LOG.md`, `CLUSTERS.md`, `PROMOTION-PROPOSALS.md`, `REJECTED.md` | 4 |
| 4 Phase-1 tools + structural CI | 5, 6, 7, 8, 10 |
| `SKILL.md` wiring (activation + pointer + retrieval + register refs) | 10 |
| Success: IR validates / no invalid on shelf / no orphans / shared detection / consistency green / no embeddings | 5, 7, 1, 10, Global Constraints |

No gaps.

**2. Placeholder scan:** the only stubs are intentional, replaced within the same task (Tasks 3,5,6,7,8 each: STUB → run-fails → real implementation → run-passes). No "TBD/handle edge cases/similar to" remain.

**3. Type/name consistency:** `collectEntries` returns `{type,dir,file,path,data,body}` (Task 4) — consumed with those exact keys in Tasks 5/6/7/8. `buildManifest(entries)` (Task 6) consumed by `surface-dedup` (Task 8). `rankCandidates` result `{entry_id,name,type,shared,jaccard}` matches its selftest + CLI print. `TYPE_DIR`/`TYPE_HOST`/`REQUIRED`/`FIREWALL_FLAGS` defined once in `schema.mjs` (Task 2), imported everywhere. Pointer format (`<!-- learned:<id> -->` + `references/learned/<dir>/<slug>.md`) is identical in `fixtures.pointerLine`, `check-pointers` regexes, and `learn-mode.md`. `--root`/`--selftest`/`isMain` convention uniform across all four tools.
