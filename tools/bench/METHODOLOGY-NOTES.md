# Methodology Notes

> Durable lessons from hardening the scroll benchmark. Read before you make a
> claim about a score, a run, or what the numbers "prove."
>
> These are guardrails against overclaiming. When in doubt, weaken the claim.

---

## 1. Deterministic scoring is not a deterministic benchmark

The **scoring** is deterministic: a published rubric turns a captured trace into
a number the same way every time, with **no human judge** in the loop. That is
what we can honestly promise — say "published, deterministic scoring rubric" and
"no human judge," not "deterministic benchmark."

The **capture** is not deterministic. What we measure varies with hardware, GPU,
network, thermal state, and page state at capture time. Same rubric, different
inputs → different scores. Two runs are only comparable when the environment is.

**Rationale:** conflating the two invites the reader to expect bit-identical
numbers across machines and then distrust the whole benchmark when they don't
match. Scope the determinism claim to the rubric alone.

---

## 2. A perf benchmark is worthless without recorded environment evidence

Every reference run must record the environment it ran in, at minimum:
`chromeVersion`, WebGL `renderer` / `vendor`, `refreshHz`, and the launch
`flags`. A score with no environment attached is uninterpretable and
unreproducible — throw it out.

The reference run **refuses software GL**: if the renderer resolves to
SwiftShader or llvmpipe, the run aborts rather than publishing a number that was
never hardware-accelerated.

**`softwareGL: false` means "no software renderer was DETECTED"** — it is *not*
proof that every frame was hardware-accelerated. Detection can miss partial or
per-layer software fallback. State it as absence-of-detection, never as a
guarantee.

**Rationale:** perf numbers are only meaningful relative to the silicon that
produced them. Without the environment block, a fast score and a slow score are
the same unfalsifiable claim.

---

## 3. Never run other GPU/browser work during the reference corpus

While the reference corpus is capturing, run **nothing else** that touches the
browser or GPU — not a quick smoke capture, not a parallel shard, not a second
tab warming up. Concurrency contaminates fps and every perf-derived axis; the
contended run looks worse and you can't tell by how much.

- Run the corpus **sequentially**, one page at a time.
- Parallelize only **non-measuring** work (fetching URLs, writing reports,
  computing scores from already-captured traces).

**Rationale:** the whole value of a reference run is that its numbers are
attributable to the page under test, not to whatever else was sharing the GPU.

---

## 4. Honest scope — heuristic is not law, correlation is not cause

- **Heuristic ≠ WCAG.** Our checks are heuristics for *cinematic scroll craft*,
  not a conformance audit. Claim "cinematic scroll craft," never "universal UX"
  or "WCAG-compliant."
- **Robots parsing:** honor `Allow` / `Disallow` by **longest-match**, and only
  literal paths — **no wildcard** (`*`, `$`) semantics. If a rule needs a
  wildcard to match, it doesn't match.
- **Don't assert causation the data only correlates.** A score that moves with a
  change is a correlation until proven otherwise; say "correlates with," not
  "causes."
- **npm installs ≠ usage.** Download counts measure that a package was fetched,
  not that anyone ran it, kept it, or benefited from it.
- **Missed launch metrics ≠ disproven thesis.** A launch that undershot a target
  is one noisy datapoint under one set of conditions — it does not falsify the
  underlying claim. Distinguish "this run missed" from "the idea is wrong."

**Rationale:** every one of these is a place where a modest, defensible claim is
tempting to inflate into a universal one. The credibility of the whole benchmark
is set by its weakest overclaim.

---

## How to add a lesson here

Add a lesson when a hardening pass reveals a way the benchmark could mislead —
an environment we forgot to record, a claim broader than the evidence, a source
of contamination. State the lesson, then a one-line rationale for *why* it
protects the reader. Keep it scannable. Weaken claims; never strengthen them
past the evidence.
