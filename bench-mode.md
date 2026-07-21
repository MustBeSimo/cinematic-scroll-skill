# Bench Mode — CinematicBench

> **Activation:** the user asks to *bench / benchmark / score a public URL's scroll experience*
> or to compare a site against the CinematicBench leaderboard.

**Bench ≠ audit.** Bench mode is **passive render observation of a public URL**: one ordinary
page load (what any visitor's browser does), one `prefers-reduced-motion` probe load, a standard
6-second scroll, and passive measurement of what the site publicly serves — the same posture as
Google PageSpeed or WebPageTest. It scores **cinematic scroll craft**, not general scroll UX or
website quality. Bench never bypasses auth, never load-tests, honors `robots.txt`, and sends a
truthful `CinematicBench/1.0` user agent. The `robots.txt` check honors both `Allow` and
`Disallow` rules with longest-match precedence (prefix rules; no wildcard `*` / `$` patterns).
[Audit mode](./audit-mode.md) is different: deep, interactive remediation analysis, and it
remains **authorization-only** (sites you own or are authorized to test).

## Run it

    node tools/bench/cli.mjs <https://url>          # or: npx -p cinematic-scroll-skill cinematic-bench <url>
      --runs 3       capture runs (median taken; default 3)
      --json         machine-readable result
      --out <file>   also write the result JSON

Exit codes: 0 = scored (a report, not a gate) · 1 = could not score (unmeasurable / no browser)
· 2 = usage error.

## What it scores

A benchmark with a published, deterministic scoring rubric (0–100, deduction-based; rubric fixed
in `tools/bench/score.mjs`) across four dimensions: **Pacing** (25%) · **Performance** (30%) ·
**Accessibility** (25%) · **Motion Craft** (20%). `overall` is the weighted mean. No human judge.
The scoring rubric is deterministic, but capture varies with hardware, network, and page state.
The rubric rewards motion by design: a static-but-excellent page caps around 82 under the current
v1.1 rubric. The Accessibility dimension is an accessibility heuristic (reduced-motion honored, a
single-Tab focus check, and sampled contrast) — not a WCAG conformance assessment and carries no
legal meaning. Methodology + reproducibility policy: `tools/bench/README.md`.
Unmeasurable sites (bot-wall, robots disallow, timeout) are reported with a reason and never
scored by guesswork.

## The leaderboard

`bench/sites.json` (corpus) → committed `bench/results/*.json` → `node
bench/build-leaderboard.mjs` → `bench/index.html`, served from the repo's GitHub Pages site.
Rubric changes bump `bench_version` in `tools/bench/score.mjs` and require re-benching the
corpus before the leaderboard is rebuilt.
