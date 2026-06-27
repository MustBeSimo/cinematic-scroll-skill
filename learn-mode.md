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
