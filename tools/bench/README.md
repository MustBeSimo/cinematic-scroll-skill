# CinematicBench — methodology

CinematicBench passively scores how a **public URL's scroll experience** renders: one ordinary
page load (plus one `prefers-reduced-motion` probe load), a standard 6-second scroll, passive
measurement. The same posture as Google PageSpeed / WebPageTest. It never bypasses auth, never
load-tests, honors `robots.txt`, and sends the truthful UA
`CinematicBench/1.0 (+https://github.com/MustBeSimo/cinematic-scroll-skill)`.
Deep, interactive **audit mode** remains authorization-only — see `bench-mode.md`.

## Score

`overall = round(0.25·Pacing + 0.30·Performance + 0.25·Accessibility + 0.20·Motion Craft)` — each
0–100, deduction-based, computed by the pure rubric in `tools/bench/score.mjs` (see the source
for every deduction value; the rubric IS the documentation).

- **Pacing** — sectioning, scroll-coupled motion presence/restraint, pin usage, scroll-jack.
- **Performance** — average fps + jank share during the standard scroll, runtime errors.
- **Accessibility** — `prefers-reduced-motion` honored, focus visibility, sampled text contrast,
  motion opt-out.
- **Motion Craft** — transform/opacity-only discipline, parallax depth, entrance choreography,
  layout stability (CLS).

## Reproducibility

Pinned 1440×900 viewport · pinned scroll profile · **median of 3 runs** (numeric median, boolean
majority) · every result stamped `bench_version` + date · any rubric change bumps `bench_version`
and re-benches the corpus. Sites that can't be measured (bot-wall, robots disallow, timeout) are
reported `unmeasurable` with the reason and are never ranked. Performance varies with hardware —
leaderboard numbers are produced on one pinned machine class; your local numbers may differ.

## Score your own site

    npx -p cinematic-scroll-skill cinematic-bench https://your-site.com
