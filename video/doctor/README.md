# Scored — the cinematic-doctor film, as HyperFrames

A 45-second, 16:9 launch film for **`cinematic-doctor`** (the 0–100 quality
gate in `tools/cinematic-doctor/`), authored as an
[HyperFrames](https://github.com/heygen-com/hyperframes) composition — plain
HTML + a paused GSAP timeline, rendered to a deterministic MP4.

The film's argument in one line: **cinematic taste is now a number you can
gate on.** Noir/petroleum air, a diagnostic grid with a scanline that never
stops reading, teal `#5ED6C6` verdicts, crimson `#E8484F` blocks.

**Fully self-contained**: zero asset files. Every visual is CSS (the grain is
an inline SVG data-URI), so the render is reproducible anywhere with
Chrome + FFmpeg.

## The cut (45s · 5 scenes)

| Scene | Time | Beat |
|---|---|---|
| 1 · Hook | 0–8s | "Taste, scored." — the claim, over the diagnostic grid |
| 2 · Scan | 8–18s | the terminal reads the build: taste · performance · a11y · mobile · 3D, line by line, each verdict ticking ✓ |
| 3 · Score | 18–30s | the number counts 0 → **87** and lands heavy; five category bars fill |
| 4 · Gate | 30–38s | crimson air — a 64 gets `exit 1 — build blocked`, an 87 gets the PASS stamp |
| 5 · End | 38–45s | `npm run doctor -- your-page.html` + repo end card (≥3s hold) |

## Render it (on a machine with Chrome access)

Requirements: Node ≥ 22, FFmpeg.

```bash
cd video/doctor
npm run dev      # live preview in the browser
npm run check    # lint + validate + inspect
npm run render   # → out/main.mp4 (1920×1080, deterministic)
```

> The build sandbox can't run Puppeteer (Chrome download blocked), so this
> project ships authored + linted. Render locally.

Like `../ship-in-5/`, the composition loads two Google-Fonts families
(Space Grotesk + Space Mono); for fully offline renders, vendor them as
`.woff2` under `assets/fonts/` and swap the `<link>` for `@font-face`.

## The Remotion twin

The same film exists as a Remotion composition (`Doctor`, 24s) in the
sibling project at `../`:

```bash
cd video
npm install
npx remotion studio src/index.ts          # preview
npm run render:doctor                     # → ../assets/doctor.mp4 (4K)
npm run render:doctor:1080                # 1080p
```

Two renderers, one art direction — see **[`../PIPELINE.md`](../PIPELINE.md)**
for the mixing strategy.
