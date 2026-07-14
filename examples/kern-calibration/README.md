# KERN — Precision Calibration

An original cinematic example website for the `cinematic-scroll` skill.

## What it demonstrates

- Two real, independently encoded and frame-matched video layers.
- A continuously playing monochrome base video.
- A synchronized full-colour video above it.
- Scroll-scrubbed CSS radial-gradient masking: five soft colour blooms open cumulatively over each mechanical system as the scan plane crosses it, then a full-frame wash floods the whole unit in colour.
- Frame-by-frame drift correction using `requestVideoFrameCallback` and circular phase-aware playback-rate convergence—no repeated seeking at the loop boundary.
- A genuinely full-viewport video stage using `object-fit: cover`; no framed media panel or transformed 3D ancestor.
- Generated precision-mechanical hero imagery converted into a seamless 11.667-second, 30 fps, 1080p locked-camera loop. The outer housing stays pixel-stable while the inner carrier, escapement and counter-rotating pinions move at exact integer loop ratios; the coil and emitter pulse without moving the camera.
- Velocity-reactive playback: scrolling accelerates the loop up to ~1.9×, easing back to 1× at rest; the loops pause off-screen and resume in sync.
- Muted inline autoplay plus pointer, touch, wheel, scroll, visibility and page-show recovery hooks.
- Five selectable mechanical systems with live, phase-locked macro video crops and matching readings.
- Procedural Web Audio ambience behind an explicit user-controlled sound toggle.
- A complete website after the hero: system catalogue, calibration protocol and closing chapter.
- Mobile and `prefers-reduced-motion` fallbacks.

## Video assets

| Asset | Role | Specification |
|---|---|---|
| `kern-mono.mp4` | Persistent base layer | 1920×1080, 30 fps, 11.667 s, H.264, locked-camera mechanical loop |
| `kern-color.mp4` | Scroll-masked colour layer | 1920×1080, 30 fps, 11.667 s, H.264, locked-camera mechanical loop |
| `kern-calibration-unit.png` | Poster and macro source | Generated precision-mechanical plate |
| `render-mechanism.py` | Deterministic renderer | Rotates isolated internal subassemblies and derives both frame-matched encodes |

The colour loop is rendered once; the monochrome layer is a desaturated encode of that exact stream. Framing, duration, frame count and mechanism motion therefore match by construction.

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
