# Four Movements — the 3D/WebXR flagship film, as HyperFrames

A 60-second, 16:9 launch film for the **`/flagship` route** (the React Three
Fiber + WebXR flagship in `templates/nextjs/`), authored as an
[HyperFrames](https://github.com/heygen-com/hyperframes) composition — plain
HTML + a paused GSAP timeline, rendered to a deterministic MP4.

Directed by the flagship's **own** art direction (not a separate brand): the
deep-space petroleum air, the cyan `#3de0ff` / ember `#ffb270` chapter accents,
the per-chapter atmosphere morphs, even a DOM translation of the route's
`RailDust` particle field. The grammar that drives the WebGL scene directs
its trailer — one choreography, two media.

**Fully self-contained**: zero asset files. Every visual is CSS + the seeded
mote field (deterministic pseudo-random, no `Math.random`), so the render is
reproducible anywhere with Chrome + FFmpeg.

## The cut (60s · 5 scenes)

| Scene | Time | Beat |
|---|---|---|
| 1 · Hook | 0–9.5s | "Four movements. One scroll." — word-stagger over the object atmosphere |
| 2 · Generate | 9.5–22s | the fal.ai pipeline chips light up: prompt → image → mesh → draco'd `.glb`, then `npm run generate:flagship -- --apply` |
| 3 · Scroll | 22–40s | the movement index — Object · World · Field · Figure rows "arrive" with the route's presence-gate beat |
| 4 · Dancer | 40–50s | "It dances out of the box." — ember spotlight + the breathing stage ring |
| 5 · Ship | 50–60s | "The motion is the constant. The look is yours." + repo end card (≥3s hold) |

## Render it (on a machine with Chrome access)

Requirements: Node ≥ 22, FFmpeg.

```bash
cd video/flagship-3d
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

The same film exists as a Remotion composition (`Flagship3D`, 30s) in the
sibling project at `../`:

```bash
cd video
npm install
npx remotion studio src/index.ts          # preview
npm run render:flagship                   # → ../assets/flagship-3d.mp4 (4K)
npm run render:flagship:1080              # 1080p
```

Two renderers, one art direction — see **[`../PIPELINE.md`](../PIPELINE.md)**
for the mixing strategy.
