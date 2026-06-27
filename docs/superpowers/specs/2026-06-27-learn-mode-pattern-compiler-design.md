# Learn Mode: The Pattern Compiler — Design

**Date:** 2026-06-27
**Branch:** `feat/learn-mode-pattern-compiler`
**Status:** Approved for execution — Phase 1 is the implementation target (user: "lets go! ... commit this as the spec")

## Problem

The `cinematic-scroll` skill can *build* (5-phase pipeline) and *audit* (score a URL on
4 dimensions → remediation plan). It cannot **learn**. Its knowledge library
(`references/scroll-patterns.md`, `film-archetypes.md`, `awwwards-techniques.md`,
`themes/`, `taste-guardrails.md`) is hand-authored and static. Every great site the
agent encounters is analyzed once and forgotten.

We want a capability that studies an exemplary site and distills reusable knowledge back
into the skill — so the skill gets better over time. But a naive "learn from a site"
feature degrades into a scraper / inspiration-dump / trend-collector that pollutes the
canon with vague "nice effect" notes and source-specific execution.

## Goal

Turn learning into a **pattern compiler**: a disciplined pipeline that converts observed
web behavior into *original, reusable, testable* design knowledge. The system should know
whether what it learned is **useful, original, reusable, and worth promoting** — not just
that it learned something.

The keystone is an **intermediate representation (Pattern IR)**: nothing reaches the shelf
until it passes structured extraction, an originality firewall, dedup, and scoring.

## Core decisions (locked in brainstorming)

1. **Intent:** teach the skill itself — distill knowledge into its own library.
2. **Buckets:** all four — techniques, visual systems/themes, film/emotional archetypes,
   taste rules/anti-patterns.
3. **Storage:** a separate **shelf** (`references/learned/`) holds full content. The canon
   only records **thin pointers** to entries. Full content is fetched on demand
   ("call it when needed"). **Pointer-first everywhere** — for context/performance hygiene.
4. **Taxonomy self-organization:** each canon host carries a `## Learned additions` pointer
   section. When ≥3 related entries cluster into a category no existing bucket covers, the
   skill may mint a **new canon category** (itself pointer-first) — **threshold + notify**
   (autonomous, but logged), plus human approval for promotion (Section: Governance).
5. **Pipeline shape:** extract the detection pipeline into a shared
   `references/detection-pipeline.md` consumed by **both** audit and learn; Learn is a
   focused **sibling mode** (`learn-mode.md`) that runs **distillation** instead of scoring.
6. **Themes pointer host:** `references/visual-systems.md` (symmetric with the other three).

### Three carried-over engineering calls (user-approved)

- **Agent/tool split.** CI enforces *structure and integrity*, never taste. Semantic
  judgment (IR authoring, firewall reasoning, scoring, similarity judgment, negative twins,
  variants) is the **agent's** job, documented in `learn-mode.md` + `learning-rubric.md`.
  Deterministic `.mjs` tools validate schema/frontmatter, pointer↔shelf integrity, surface
  dedup candidates by tag/keyword overlap, count clusters, sync the manifest, aggregate usage.
- **Reuse as booster, not gate (Phase 1).** The skill is stateless markdown — there is no
  runtime to instrument. `reuse_score` is captured by a convention (USAGE-LOG, Phase 2).
  Making "≥1 reuse" a hard promotion gate in Phase 1 would deadlock promotion. Reuse is a
  promotion **booster/tie-breaker** until telemetry accrues; it becomes a hard gate in Phase 3.
- **IR persisted as entry frontmatter.** The IR lives as YAML frontmatter at the top of each
  shelf entry (self-contained, no sidecar drift). `sync-manifest.mjs` projects indexed fields
  into `manifest.json`.

## Architecture & file layout

```
SKILL.md                      EDIT: activation (+"learn from / study a URL"); +1 pointer to
                              learn-mode.md; +1 build-pipeline line ("consult canon
                              'Learned additions' and fetch shelf entries on demand");
                              register new reference files + any minted canon
audit-mode.md                 EDIT: detection section → points to shared detection-pipeline.md
learn-mode.md                 NEW: the Learn capability — trigger, pipeline, taxonomy rules,
                              threshold+notify logic, firewall + dedup procedure
references/
  detection-pipeline.md       NEW: the 7-category detection, extracted once; consumed by
                              BOTH audit-mode and learn-mode
  pattern-ir.md               NEW: canonical Pattern IR schema (the gate)
  learning-rubric.md          NEW: scoring rules + originality abstraction tests
  promotion-rules.md          NEW: canon promotion policy
  visual-systems.md           NEW: learned-theme pointer host (canon)
  scroll-patterns.md          EDIT: + "## Learned additions" (techniques)
  film-archetypes.md          EDIT: + "## Learned additions" (archetypes)
  taste-guardrails.md         EDIT: + "## Learned additions" (taste rules)   [root file]
  learned/                    NEW: THE SHELF — full content lives ONLY here
    techniques/<slug>.md      one reusable recipe per file (IR frontmatter + body)
    themes/<slug>.md
    archetypes/<slug>.md
    taste/<slug>.md
    <new-category>/<slug>.md  created on governed promotion
    manifest.json             tooling source-of-truth (projected from IR frontmatter)
    LEARNING-LOG.md           append-only: every session + every new-canon mint
    CLUSTERS.md               emerging groups that may become canon
    PROMOTION-PROPOSALS.md    human-review buffer between CLUSTERS.md and canon promotion
    REJECTED.md               useful rejects, with reasons (learn what NOT to learn)
tools/
  learn/                      NEW
    validate-ir.mjs           IR schema + frontmatter validation
    check-pointers.mjs        pointer↔shelf integrity (no orphans both ways)
    surface-dedup-candidates.mjs   tag/keyword overlap (NOT semantic) → candidate list
    sync-manifest.mjs         project IR frontmatter → manifest.json
  check-consistency.mjs       EDIT: include learned-shelf integrity in the CI sweep
manifest.json                 EDIT: register the Learn capability; clarify it reuses audit's
                              already-disclosed browser/fetch network exception (no new one)
```

**Granularity:** the atomic unit is **one reusable recipe** (one technique / theme /
archetype / taste rule), grouped by type. Pointers, dedup, scoring, and promotion all
operate per-unit. A single site can yield several units across several buckets.

**`taste-guardrails.md` lives at repo root** (not under `references/`); its `## Learned
additions` section points into `references/learned/taste/`.

## The Pattern IR (keystone)

`learn-mode.md` may **never** write to `learned/*.md` directly. Each candidate becomes a
validated IR object first, persisted as YAML frontmatter on its shelf entry. Schema is
canonical in `references/pattern-ir.md`; `validate-ir.mjs` enforces it in CI. An entry whose
IR fails validation is rejected to `REJECTED.md` with the reason.

```yaml
schema_version: "1.0"                  # REQUIRED — IR schema version (semver string)
entry_id: ""                           # REQUIRED — stable unique id, SEPARATE from slug,
                                       #   e.g. "learned-technique-0001"
                                       #   (slug may change; entry_id never does)
slug: ""                               # human-readable file slug
type: technique | theme | archetype | taste-rule | <minted-category>
status: candidate | accepted | merged | rejected | deprecated | promoted
name: ""
source_url: ""
observed_date: ""
machine_distilled: true

evidence:
  observation_method: browser | fetch | screenshot | dom | motion-trace
  source_elements: [visual | interaction | layout | copy | timing | media]
  copied_material: false

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
  complexity: low | medium | high
  tags: []                             # REQUIRED — keywords for tag-based dedup surfacing
                                       #   (the only signal surface-dedup-candidates.mjs reads;
                                       #   no embeddings in Phase 1)

scores:                                # agent-assigned (no model/embedding deps in P1)
  confidence: 0.0                       # understood the pattern correctly
  novelty: 0.0                          # different from canon + shelf
  originality_risk: 0.0                 # closeness to source-specific execution
  reuse: null                           # set by telemetry (Phase 2); booster only

dedup:
  nearest_existing_entries: []
  similarity_score: 0.0                 # agent judgment over tool-surfaced candidates
  action: create | merge | skip
  reason: ""

promotion:
  eligible_for_canon: false
  cluster_id: ""                        # links to CLUSTERS.md
  required_cluster_size: 3
  source_diversity_required: true
  human_review_required: true
```

**Entry body (below frontmatter), Phase 1 mandatory sections:** reusable recipe ·
constraints · failure modes · **negative twin** ("what this is NOT / how it fails") ·
**≥1 original implementation variant** (agent-authored — the heart of "compiler, not
scraper"; only the *tooling* that scaffolds variants is deferred to Phase 4).

## The learning pipeline (data flow)

```
1. Observe authorized URL (browser/fetch, via shared detection-pipeline.md)
2. Extract candidates across technique / theme / archetype / taste-rule buckets   [agent]
3. Author Pattern IR per candidate                                                [agent]
4. Originality firewall — run abstraction tests; must be re-describable without
   the source open; no verbatim code/assets/copy/brand                            [agent]
5. Dedup — surface candidates by tag/keyword overlap [tool] → judge similarity
   [agent] → decide dedup.action, ALWAYS log the reason:
     - create → new entry (continue)
     - merge  → fold into the nearest existing entry; the candidate's status = merged,
                no new file written; the target entry is updated + re-synced
     - skip   → already covered; log to REJECTED.md with reason (status = rejected)
6. Score — confidence, novelty, originality_risk                                  [agent]
7. validate-ir.mjs gate — schema/frontmatter must pass, else → REJECTED.md (status = rejected)
8. Write full entry to the shelf (IR frontmatter + recipe + negative twin + variant);
   status = accepted
9. Inject a thin pointer into the matching canon host
10. sync-manifest.mjs ; append LEARNING-LOG.md
11. Update CLUSTERS.md if the candidate feeds an emerging group
12. Promotion is PROPOSED (PROMOTION-PROPOSALS.md), never auto-applied
```

**Status lifecycle:** `candidate` (in-flight, pre-gate) → `accepted` (passed gates, on shelf
with a canon pointer) | `merged` (folded into an existing entry) | `rejected` (failed
firewall/schema or skipped as duplicate → `REJECTED.md`). Later: `promoted` (its cluster
was approved into a canon category) and `deprecated` (superseded; pointer removed, entry
retained for provenance). `entry_id` is stable across every transition; `slug` may change.

## Discovery, retrieval & reuse

- **Discovery (Phase 1):** each canon host (`scroll-patterns.md`, `film-archetypes.md`,
  `visual-systems.md`, `taste-guardrails.md`) carries a thin `## Learned additions` pointer
  section. `SKILL.md` instructs the build pipeline to scan these and fetch shelf entries on
  demand.
- **Retrieval by intent (Phase 2):** a rubric so builds query learned entries by *goal*,
  not just bucket.
- **Reuse telemetry (Phase 2):** `USAGE-LOG.md` convention — when a build/audit applies an
  entry, append `{entry_id, context, date}`; `aggregate-usage.mjs` rolls counts into
  `reuse` score. Until then, reuse is a promotion booster only.

## Governance (promotion, clusters, proposals, rejects)

Flow: `CLUSTERS.md` (emerging groups) → `PROMOTION-PROPOSALS.md` (human-review buffer) →
canon. Promoting a cluster to a **new canon category** requires **all** of:

1. ≥3 related entries.
2. Sources span ≥2 distinct domains (source diversity — stops single-trend "soup").
3. Not already covered by existing canon.
4. Clear name, scope, anti-scope, and examples.
5. **Human approval** (the proposal in `PROMOTION-PROPOSALS.md` is approved).
6. *(Phase 3)* ≥1 reuse recorded — booster in Phase 1/2, hard gate from Phase 3.

New-canon files are pointer-first, registered in `SKILL.md`, and logged to `LEARNING-LOG.md`
(threshold + notify). `REJECTED.md` records useful rejects with reasons so the system learns
what *not* to learn.

## Safety & originality firewall

- Reuses audit mode's **already-disclosed** browser/fetch network exception — no new
  exception added to `manifest.json`.
- **Domain allowlist + authorized-use confirmation** before observing.
- **robots/ToS disclosure note** in the session log.
- **Redaction:** no PII, credentials, or private content captured.
- **Abstraction tests (operational firewall):** the entry must be re-implementable from
  principle with the source closed; no verbatim code, assets, copy, or brand naming;
  `originality_risk` flags anything source-specific. Honors the skill's Legal & Originality
  rules.

## Tooling, CI & evals

- **Agent vs deterministic split** is the law (Section: carried-over calls).
- **Phase 1 tools:** `validate-ir.mjs`, `check-pointers.mjs`, `surface-dedup-candidates.mjs`,
  `sync-manifest.mjs`, all wired into `tools/check-consistency.mjs` + CI.
- **Structural evals (Phase 1):** IR schema valid · frontmatter complete · pointers resolve
  both ways (no orphans) · `entry_id` unique + stable · `status`/`schema_version` present ·
  minted canon registered in `SKILL.md`.
- **Semantic evals (Phase 4):** originality re-describability, usefulness.

## Phase roadmap

| Phase | Scope |
|---|---|
| **1 — Compiler core** *(this spec's implementation target)* | IR gate + `pattern-ir.md` · `learn-mode.md` · extracted `detection-pipeline.md` (audit refactored to use it) · shelf + per-recipe entries (IR frontmatter + recipe + negative twin + 1 variant) · 4 canon pointer hosts incl. new `visual-systems.md` · firewall + `learning-rubric.md` · **tag/keyword dedup only — NO semantic model or embedding dependency** · `promotion-rules.md` (manual, human-approved) · `manifest.json` · `LEARNING-LOG.md` · `CLUSTERS.md` · `PROMOTION-PROPOSALS.md` · `REJECTED.md` · 4 Phase-1 tools + structural CI · `SKILL.md` wiring |
| **2 — Telemetry** | `USAGE-LOG.md` + `aggregate-usage.mjs` · build-time retrieval-by-intent · reuse becomes measurable (still booster) |
| **3 — Governance automation** | `count-clusters.mjs` threshold detection + auto-notify · source-diversity checks · reuse becomes a **hard** promotion gate · optional semantic scoring (gated behind an explicit, opt-in embedding/model dependency) |
| **4 — Generative + semantic evals** | `generate-variants.mjs` scaffolding · negative-twin tooling · full learning eval suite (originality, usefulness) in `evals/` + CI |

## Out of scope (YAGNI)

- **No semantic model / embedding dependency in Phase 1** (explicit). Similarity is
  tag/keyword surfaced by tool, then judged by the agent.
- No batch/multi-URL learning in Phase 1 (single URL per session; batch is a later add).
- No runtime/backend telemetry service — reuse is a markdown convention (Phase 2).
- No auto-promotion to canon — promotion always passes through human review.
- No new third-party network exception — reuse audit mode's disclosed one.

## Success criteria (Phase 1)

- `Learn [URL]` runs: observes an authorized site, produces ≥1 shelf entry whose IR passes
  `validate-ir.mjs`, with a recipe + negative twin + ≥1 original variant.
- No shelf entry is written that fails the firewall or schema gate; rejects land in
  `REJECTED.md` with reasons.
- Every shelf entry has a thin pointer in its canon host; `check-pointers.mjs` reports zero
  orphans in either direction.
- `audit-mode.md` and `learn-mode.md` both consume `detection-pipeline.md`; no detection
  logic is duplicated.
- `tools/check-consistency.mjs` passes with learned-shelf integrity checks included.
- `SKILL.md` activates Learn, points to `learn-mode.md`, and tells the build pipeline to
  consult `## Learned additions` and fetch on demand.
- Phase 1 introduces **no** semantic-model/embedding dependency.
