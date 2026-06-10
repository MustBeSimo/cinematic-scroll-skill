# cinematic-doctor

> An executable quality gate that scores a cinematic-scroll build **0–100** and
> exits non-zero below threshold. The difference between slop and craft is
> anti-convergence — this tool refuses to let tasteless, janky, or inaccessible
> output ship.

`cinematic-doctor` is a zero-dependency Node ESM CLI (Node stdlib only — no HTML
parser, no color libs). It statically reads an HTML build, grounds five
categories of checks in this project's own `taste-guardrails.md` and
`references/performance-budget.md`, prints a scorecard, and writes
`cinematic-report.json`.

## Run

```bash
# score one file
node tools/cinematic-doctor/cli.mjs examples/noir/index.html

# score a directory (walks it recursively for *.html)
node tools/cinematic-doctor/cli.mjs .          # whole repo
node tools/cinematic-doctor/cli.mjs examples   # just the example worlds

# raise the bar
node tools/cinematic-doctor/cli.mjs path/to/build.html --min 90

# machine output only
node tools/cinematic-doctor/cli.mjs build.html --json
node tools/cinematic-doctor/cli.mjs build.html --quiet   # exit code only

# prove the gate works: good fixture must PASS, bad fixture must FAIL
node tools/cinematic-doctor/cli.mjs --selftest
```

It accepts either a single `.html` file **or** a directory, which is walked
recursively for `*.html`. Dependency/build trees (`node_modules`, `.next`,
`dist`, …) and the doctor's own `fixtures/` are skipped. **HyperFrames video
compositions** (fixed-canvas render targets — detected by `data-composition-id`
or a pixel-pinned viewport) are recognized and skipped too: they're graded by
the video pipeline, not against responsive web rules, so scoring them here would
be a false positive. When multiple files are scored, the gate fails if **any**
web build is below threshold (the lowest total drives the exit code).

## Categories & weights

Each category returns a `0–100` sub-score. Weights are **relative** — when a
category is N/A its weight is dropped and the rest re-normalize.

| Category      | Weight | What it enforces (source) |
|---------------|:------:|---------------------------|
| `taste`       | **30** | No `transition: all`; at least one custom `cubic-bezier`/named ease; default/`linear` easings not used pervasively; sections don't all share one fade-in (anti-convergence). — `taste-guardrails.md` §1.11, §4 |
| `performance` | **25** | No animating `top/left/width/height/margin/padding` on scroll hot paths; ≤ 7 depth layers per chapter; no render-blocking `<script>` in `<head>` without `defer/async/module`; `devicePixelRatio` capped when WebGL present. — `references/performance-budget.md` §1, §2, §5; guardrails §1.6, §1.7 |
| `a11y`        | **20** | A `prefers-reduced-motion` block (CSS and/or JS); `alt` on every `<img>`; a `:focus`/`:focus-visible` style; ≥ 1 semantic landmark (`main`/`nav`/`header`/`footer`). — budget §3 Tier 4; guardrails §1.9, §5 |
| `mobile`      | **15** | A viewport meta; no hover-only interactions without a touch/pointer fallback; a mobile / reduced-layer path (breakpoint or touch branch). A flat, motionless mobile page is itself a failure mode. — `references/mobile-motion.md`; guardrails §1.9 |
| `threed`      | **10** | **Only when WebGL / Three.js / `<model-viewer>` is detected**, else **N/A** (excluded, weight redistributed). Requires a `webglcontextlost` handler, a visible fallback, a Draco/compression or `pixelRatio` cap hint, and XR feature-detection (`navigator.xr` / `isSessionSupported`) before any `requestSession`. — budget §2, §8 |

**Total** = Σ (sub-score × normalized weight), rounded.

## Threshold & exit codes

Default threshold is **80** (override with `--min N`).

| Exit | Meaning |
|:----:|---------|
| `0`  | total ≥ threshold (or `--selftest` behaved correctly) |
| `1`  | total < threshold (or `--selftest` failed) |
| `2`  | usage / I/O error (bad flag, missing path, no HTML found) |

This makes it drop-in for CI or a pre-commit hook:

```bash
node tools/cinematic-doctor/cli.mjs dist/index.html --min 85 || exit 1
```

## Output

- **Scorecard** to stdout: per-category bars, sub-scores, normalized weights, and
  every finding (`✗ error` / `! warn` / `· info` / `✓ pass`) with a source line
  number where one can be located. ANSI color auto-disables for non-TTY / `NO_COLOR`.
- **`cinematic-report.json`** written next to the CLI — a stable, machine-readable
  shape (single object for one file; `{ reports: [...] , lowestTotal, pass }` for many).

## Findings, not just a number

Every deduction is a concrete, actionable finding tied to a guardrail. Example
against `examples/noir/index.html`:

```
performance   ██████████████░░░░░░ 74  /100
    ✗ error CSS transition animates layout prop(s) (1×) — use transform … (line 114)
    ✗ error JS animates layout prop(s) (1×) in a scroll/rAF context … (line 501)
a11y          ████████████████░░░░ 82  /100
    ✗ error no :focus / :focus-visible style — keyboard users need a visible focus indicator
```

## How it works (no parser)

`lib/doc.mjs` is a forgiving, hand-rolled extractor (HARD RULE: no parser
dependency). It:

1. blanks HTML comments (length-preserving, so line numbers stay accurate);
2. pulls `<style>` and `<script>` content into separate CSS/JS blobs, blanking
   their bodies in the markup so a tag scan never trips on `{}`;
3. strips CSS/JS comments from those blobs (so a banned pattern that lives only
   inside a comment never produces a finding);
4. provides an O(log n) offset→line lookup so findings can point at a line.

Each `checks/*.mjs` exports `analyze(doc) -> { category, score, findings }`
(or `{ category, score: null, na: true }`). `lib/scorecard.mjs` aggregates,
normalizes, and renders. `cli.mjs` wires it together and sets the exit code.

## Files

```
tools/cinematic-doctor/
  cli.mjs              CLI entry + --selftest  (index.mjs re-exports it)
  checks/taste.mjs
  checks/performance.mjs
  checks/a11y.mjs
  checks/mobile.mjs
  checks/threed.mjs    (conditional — N/A when no 3D)
  lib/doc.mjs          parser-free document model
  lib/scorecard.mjs    weighting + normalization + terminal output
  fixtures/good.html   correct page — MUST score ≥ 80
  fixtures/bad.html    deliberate violations — MUST score < 80
  cinematic-report.json (generated)
```
