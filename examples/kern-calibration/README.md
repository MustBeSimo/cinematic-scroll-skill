# KERN — Precision Calibration

An original cinematic example website for the `cinematic-scroll` skill.

## What it demonstrates

- Two real, independently encoded and frame-matched video layers.
- A continuously playing monochrome base video.
- A synchronized full-colour video above it.
- Scroll-scrubbed CSS radial-gradient masking: five soft colour blooms open cumulatively over each mechanical system as the scan plane crosses it, then a full-frame wash floods the whole unit in colour.
- Frame-by-frame drift correction using `requestVideoFrameCallback` and circular phase-aware playback-rate convergence—no repeated seeking at the loop boundary.
- A genuinely full-viewport video stage using `object-fit: cover`; no framed media panel or transformed 3D ancestor.
- A genuinely generated hero video: the still plate is animated by a fal.ai image-to-video model (Kling), so the exposed gears, escapement and central tourbillon actually rotate while the camera slowly orbits — real motion, not a pan over a frozen image. The 5-second clip is crossfaded tail-into-head into a seamless loop.
- Velocity-reactive playback: scrolling accelerates the loop up to ~1.9×, easing back to 1× at rest; the loops pause off-screen and resume in sync.
- Muted inline autoplay plus pointer, touch, wheel, scroll, visibility and page-show recovery hooks.
- Five selectable mechanical systems with live, phase-locked macro video crops and matching readings.
- Procedural Web Audio ambience behind an explicit user-controlled sound toggle.
- A complete website after the hero: system catalogue, calibration protocol and closing chapter — all scroll-choreographed (scrubbed, reversible entrances with per-card parallax depths, a drawing protocol timeline, and a dolly-in finale; transform + opacity only).
- Full-bleed on every viewport: mobile keeps the same sticky full-viewport video as desktop (panels become compact top-corner overlays), never a letterboxed band; plus a `prefers-reduced-motion` static fallback.

## Video assets

| Asset | Role | Specification |
|---|---|---|
| `kern-mono.mp4` | Persistent base layer | 1920×1080, 30 fps, 4.47 s, H.264, seamless-looped i2v generation |
| `kern-color.mp4` | Scroll-masked colour layer | 1920×1080, 30 fps, 4.47 s, H.264, seamless-looped i2v generation |
| `kern-calibration-unit.png` | Source plate | Generated precision-mechanical still fed to the video model |
| `generate-i2v.py` | Primary generator | fal.ai Kling image-to-video → seamless loop → colour + mono + poster (needs `FAL_KEY`) |
| `render-mechanism.py` | Offline fallback | No-network single-still coherent camera move (used when no video model / key is available) |

The colour loop is generated once; the monochrome layer is a desaturated encode of that exact stream, so framing, duration, frame count and motion match by construction. Regenerate with `FAL_KEY=<id:secret> python3 assets/generate-i2v.py`.

## Originality boundary

The example is an original composition inspired by the broad grammar of cinematic technical interfaces. It does not reproduce another creator's subject, names, copy, assets, code or branded interface.

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080/examples/kern-calibration/
```

## Regression checks

```bash
node examples/kern-calibration/test-immersive.mjs
node examples/kern-calibration/test-mobile.mjs
node examples/kern-calibration/test-loop-stability.mjs
python3 examples/kern-calibration/test-mechanism-motion.py
python3 examples/kern-calibration/test-video-motion.py
```
