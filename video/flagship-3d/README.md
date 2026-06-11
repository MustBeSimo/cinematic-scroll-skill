# Four Movements — the 3D/WebXR flagship film, as HyperFrames

A 60-second, 16:9 launch film for the **`/flagship` route** (the React Three
Fiber + WebXR flagship in `templates/nextjs/`), authored as an
[HyperFrames](https://github.com/heygen-com/hyperframes) composition — plain
HTML + a paused GSAP timeline, rendered to a deterministic MP4.

**Built on real captures of the live route** (`assets/`): the hero frame, the
fal.ai concept→mesh pair, a 9-second scroll-through recorded from the running
page with a CDP *virtual-time* camera (every captured frame advances the
browser clock exactly 1/30 s — the damped camera, rail dust, FOV kick and the
samba all play at true speed), and the spotlit dancer. The film shows the
product, not a storyboard of it.

## The cut (60s · 6 scenes)

| Scene | Time | Beat |
|---|---|---|
| 1 · Hook | 0–10s | slow push-in on the real hero frame — "Four movements. One scroll." |
| 2 · Generate | 10–22s | the real fal.ai concept image → the same artifact live in the scene, then `npm run generate:flagship -- --apply` |
| 3 · The Ride | 22–31s | the 9s scroll-through capture, 1:1 — the route's own overlay narrates each movement |
| 4 · The Index | 31–40s | movement index over the Field capture — rows arrive with the route's presence beat |
| 5 · Dancer | 40–50s | the real concert-spotlight frame — "It dances out of the box." |
| 6 · Ship | 50–60s | "The motion is the constant. The look is yours." + repo end card (≥3s hold) |

## Re-capturing the assets

The shipped frames are checked in precisely so the film renders without a
running app. To refresh them after a visual change to the route: run
`npm run dev` in `templates/nextjs`, open `/flagship`, and re-shoot (the
originals were recorded with Playwright + CDP virtual time at 1920×1080/30fps).

## Render it (on a machine with Chrome access)

Requirements: Node ≥ 22, FFmpeg.

```bash
cd video/flagship-3d
npm run dev      # live preview in the browser
npm run check    # lint + validate + inspect
npm run render   # → out/main.mp4 (1920×1080, deterministic)
```

Like `../ship-in-5/`, the composition loads two Google-Fonts families
(Space Grotesk + Space Mono); for fully offline renders, vendor them as
`.woff2` under `assets/fonts/` and swap the `<link>` for `@font-face`.

## The Remotion twin

The same film exists as a Remotion composition (`Flagship3D`, 30s) in the
sibling project at `../`, fed by the same captures via `public/flagship/`:

```bash
cd video
npm install
npx remotion studio src/index.ts          # preview
npm run render:flagship                   # → ../assets/flagship-3d.mp4 (4K)
npm run render:flagship:1080              # 1080p
```

Two renderers, one art direction — see **[`../PIPELINE.md`](../PIPELINE.md)**
for the mixing strategy.
