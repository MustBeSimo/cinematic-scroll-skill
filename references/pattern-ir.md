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
