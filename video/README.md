# Cinematic Scroll — Promo (Remotion)

A programmatic, version-controlled promo video for the skill. Edit code → re-render.
No screen recording, no timeline scrubbing — the video *is* React.

## What it renders
A ~26-second piece @ 30fps. The composition is authored at 1920×1080 and rendered at
`--scale=2` → a true **3840×2160 (4K)** file with razor-sharp text and vectors.

1. **Prompt** (0–3.7s) — a human types one sentence into Claude.
2. **Build flash** (3.7–6.0s) — the agent art-directs (code streams by, "Phase 3 — Build").
3. **Pipeline** (6.0–9.2s) — the 5-phase process lights up: Audit → Storyboard → Spec → Build → Polish.
4. **Noir scroll site** (9.2–19.2s) — the finished page scrolling: parallax depth layers, two clip-path **mask-wipe titles** (HOLLOW STAR · INTO THE DARK), a scroll-driven **3D camera**, background morph, progress HUD, and a tracking index rail.
5. **Worlds montage** (19.2–23.0s) — same engine, five clashing looks.
6. **End card** (23.0–25.8s) — name, `npx` install command, URL.

> **Resolution knob:** `--scale=2` = 4K, `--scale=1.5` ≈ 1440p, omit it for 1080p. `npm run render:1080` gives a smaller 1080p MP4 for platforms (X, etc.) that don't need 4K. **Length knob:** the per-scene frame counts in `src/Promo.tsx`.

## Render it (on your machine — ~1–2 min)

```bash
cd video
npm install            # first time only; Remotion auto-downloads headless Chrome
npm run build:all      # → ../assets/demo-loop.mp4 + .webm + demo-poster.jpg
```

Individual targets:

```bash
npm run render         # MP4 (H.264, yuv420p, crf 18) → ../assets/demo-loop.mp4
npm run render:webm    # WebM (VP9)                    → ../assets/demo-loop.webm
npm run poster         # still frame                   → ../assets/demo-poster.jpg
npm run gif            # optional GIF fallback         → ../assets/demo-loop.gif
```

Preview/tweak interactively:

```bash
npm run studio         # opens the Remotion Studio in your browser
```

> **Why you have to run it locally:** rendering needs headless Chrome. The build sandbox
> this was authored in blocks the Chrome download (and has no system Chrome), so the final
> encode happens on your machine. The project itself is complete and validated.

## Edit guide
- **Palette / worlds:** `src/theme.ts`
- **Fonts:** `src/fonts.ts` (Space Grotesk · Space Mono · Cormorant, via `@remotion/google-fonts`)
- **Timing:** durations in `src/Promo.tsx` (frames @ 30fps)
- **Scenes:** `src/scenes/*` — each is independent and < 130 lines
- **Reusable motion:** `src/components/` (`MaskWipeTitle`, `Caption`, `Grain`/`Vignette`)
- **The brief shown on screen:** `BRIEF` in `src/scenes/PromptScene.tsx`

## Make a vertical cut (for Reddit / TikTok / Shorts)
Add a second composition in `src/Root.tsx` with `width={1080} height={1920}` and a new id,
then `remotion render src/index.ts PromoVertical ../assets/demo-vertical.mp4`. The scenes
use relative layout, but re-check framing in the Studio first.
