# CinematicBench — methodology

CinematicBench is a benchmark with a published, deterministic scoring rubric for **cinematic
scroll craft**. It passively scores how a **public URL's scroll experience** renders: one ordinary
page load (plus one `prefers-reduced-motion` probe load), a standard 6-second scroll, passive
measurement. No human judge. The same posture as Google PageSpeed / WebPageTest. It never bypasses
auth, never load-tests, honors `robots.txt` (both `Allow` and `Disallow`, longest-match prefix
rules; no `*`/`$` wildcard patterns), and sends the truthful UA
`CinematicBench/1.0 (+https://github.com/MustBeSimo/cinematic-scroll-skill)`.
Deep, interactive **audit mode** remains authorization-only — see `bench-mode.md`.

This measures cinematic scroll craft, not scroll UX or website quality in general. The rubric
rewards motion by design: under the current v1.1 rubric a static-but-excellent page caps around 82.

## Score

`overall = round(0.25·Pacing + 0.30·Performance + 0.25·Accessibility + 0.20·Motion Craft)` — each
0–100, deduction-based, computed by the pure rubric in `tools/bench/score.mjs` (see the source
for every deduction value; the rubric IS the documentation).

- **Pacing** — sectioning, scroll-coupled motion presence/restraint, pin usage, scroll-jack.
- **Performance** — average fps + jank share during the standard scroll, runtime errors.
- **Accessibility** — an accessibility heuristic, not a WCAG conformance check and with no legal
  meaning: `prefers-reduced-motion` honored, a single-Tab focus check, sampled text contrast.
- **Motion Craft** — transform/opacity-only discipline, parallax depth, entrance choreography,
  layout stability (CLS).

## Reproducibility

Pinned 1440×900 viewport · pinned scroll profile · headless Chromium with hardware GPU acceleration (the reference rig is ANGLE Metal on Apple silicon) · **median of 3 runs** (numeric median, boolean majority) · every result stamped with the bench_version + date · any rubric or rig change bumps the bench_version and re-benches the corpus. Sites that can't be measured (bot-wall, robots disallow, timeout) are
reported `unmeasurable` with the reason and are never ranked. The scoring rubric is deterministic,
but capture varies with hardware, network, and page state — leaderboard numbers are produced on one
pinned machine class; your local numbers may differ.

## Provenance

Each result carries an environment block: `chromeVersion`, `OS`, `CPU`, WebGL `renderer`,
`gpuVendor`, `refreshHz`, `launchFlags`, and `softwareGL`. The corpus run writes
`bench/RUN-ENVIRONMENT.json` plus raw per-run captures under `bench/raw/`. The reference corpus run
**refuses to publish on software GL** (SwiftShader / llvmpipe).

## cinematic-doctor is separate

`cinematic-doctor` is the skill's own six-category quality gate — a separate tool from this
leaderboard, not a CinematicBench score. The leaderboard page separately passes `doctor >= 90`;
that gate result is not a CinematicBench overall.

## Score your own site

    npx -p cinematic-scroll-skill cinematic-bench https://your-site.com
