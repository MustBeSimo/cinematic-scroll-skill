# The video pipeline — mixing Remotion + HyperFrames

This repo contains **two video stacks** and a compiler that feeds both:

| Project | Stack | Best at |
|---|---|---|
| `video/` (root) | [Remotion](https://remotion.dev) — React, frame-driven | **Master assembly**: `<Sequence>`, audio mixing, `@remotion/captions`, data-driven scenes, Lambda scale |
| `video/ship-in-5/` | [HyperFrames](https://github.com/heygen-com/hyperframes) — HTML + paused GSAP | **Scene generation**: agents author HTML directly, FRAME.md brand steering, shader-transition catalog, zero build |
| `compile-choreography.mjs --target video` | the skill's own compiler | **The source of truth** that feeds either one |

Both render deterministic MP4s from web tech. They are not competitors here —
they are two render backends. Three ways to combine them, in ascending order
of ambition:

## 1. Clip pipeline (works today, zero glue)

Each tool renders what it's best at; one assembles. Both emit MP4, so they
compose freely:

```
HyperFrames scenes (FRAME.md-directed) ──► MP4 clips ──┐
                                                       ├─► Remotion master:
Remotion synthetic scenes (data-driven) ───────────────┘   <OffthreadVideo> +
                                                           captions + audio mix
```

This already half-exists in the repo: `assets/demo-loop.mp4` is the Remotion
promo render, and the HyperFrames composition embeds `assets/demo-montage.mp4`
as a clip. The pipeline just hadn't been named.

## 2. Runtime mixing (one thin adapter)

GSAP runs *inside* Remotion deterministically if you drive it per frame:

```tsx
const tl = useMemo(() => buildChoreographyTimeline(gsap), []);
useEffect(() => { tl.seek(frame / fps, false); }, [frame]);
```

This hosts the exact GSAP scenes from a HyperFrames composition inside Remotion
components — one motion source, Remotion's assembly, no double rendering.
(The reverse — React inside HyperFrames — buys nothing. Don't.)

## 3. One choreography, two media (the flagship)

The skill's signature mechanic compiles **the same declarative document** to
both targets:

```bash
node compile-choreography.mjs scene.json --target web    # → GSAP ScrollTrigger (the site)
node compile-choreography.mjs scene.json --target video  # → paused timeline (the film)
```

Scroll progress becomes seconds via FRAME.md §5 pacing (1.2s per 100vh,
clamped 4–14s scene dwell); pins become scene holds; title-reveal scroll
fractions become timed positions; velocity nodes are dropped (no scroll
velocity in fixed time). The DOM contract (`[data-chapter]`, `[data-layer]`,
`[data-title]`) is identical for both — one skeleton, two media.

**Website and launch film from one source — same beats, same easings, same
depth choreography.** See `scroll-choreography-compilation.md` § "One
choreography, two media" for the full mapping table and Remotion adapter.

## Recommendation

- **Launch:** render both existing projects, ship the better cut. Don't build
  pipeline #1 for a single 60s promo — that's over-engineering.
- **The skill's story:** pattern #3 is the differentiator. "HTML is the new
  After Effects" made literal: the choreography document is the screenplay,
  the compiler is the director, web and video are just distribution formats.
