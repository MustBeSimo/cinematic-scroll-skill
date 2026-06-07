# Ship in 5 Minutes — the launch guide, as a HyperFrames film

A 60-second, 16:9 video guide for **cinematic-scroll**, authored as an
[HyperFrames](https://github.com/heygen-com/hyperframes) composition — plain
HTML + a paused GSAP timeline, rendered to a deterministic MP4.

Directed by the repo's own **[`FRAME.md`](../../FRAME.md)**: the same design
tokens and taste rules that drive the scroll pages (Petroleum Editorial palette,
Cormorant + Space Mono, the §4.1 easing curves) direct this film. The grammar
that builds the site renders the trailer.

## The cut (60s · 5 scenes)

| Scene | Time | Beat |
|---|---|---|
| 1 · Hook | 0–9.5s | "HTML is the new After Effects." — word-stagger + noir still push-in |
| 2 · Install | 9.5–21.5s | `npx skills add MustBeSimo/cinematic-scroll-skill` |
| 3 · Prompt | 21.5–33.5s | "Describe your world." — the brutalist-page prompt |
| 4 · Compose | 33.5–47.5s | The real demo montage plays in a brass-bracketed frame |
| 5 · Ship | 47.5–60s | "The motion is the constant. The look is yours." + repo end card |

## Render it (on a machine with Chrome access)

Requirements: Node ≥ 22, FFmpeg.

```bash
cd video/ship-in-5
npm run dev      # live preview in the browser
npm run check    # lint + validate + inspect
npm run render   # → out/main.mp4 (1920×1080, deterministic)
```

> The build sandbox can't run Puppeteer (Chrome download blocked), so this
> project ships authored + linted (0 errors). Render locally.

### Known lint warnings (2)

The composition loads Cormorant Garamond + Space Mono from Google Fonts. That's
fine for online renders (your Mac), but offline/sandboxed renders need local
fonts. To make it fully deterministic:

1. Download the two families as `.woff2` (e.g. via [google-webfonts-helper](https://gwfh.mranftl.com/fonts)),
2. Drop them in `assets/fonts/`,
3. Replace the `<link>` with `@font-face` rules pointing at the local files.

## Assets

| File | Source |
|---|---|
| `assets/hook-noir.png` | the gallery's sci-fi noir world (skill-generated) |
| `assets/demo-montage.mp4` | real scroll captures of the two live examples |
| `assets/world-*.jpg` | Renaissance + studio hero stills (available for recuts) |

Everything is produced by the skill itself — no stock.

## Mixing with Remotion

A sibling Remotion project lives at `../` — and the skill's compiler feeds both
stacks from one choreography document (`compile-choreography.mjs --target video`).
See **[`../PIPELINE.md`](../PIPELINE.md)** for the full mixing strategy.

## Recut it

This composition is also the **reference implementation of FRAME.md**. To make
your own cinematic-scroll-branded video, point your agent at `FRAME.md` +
this file and ask for a new cut — different length, different scenes, same
grammar. (With the HyperFrames skills installed: `npx skills add heygen-com/hyperframes`.)
