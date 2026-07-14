# KERN — Precision Calibration

An original cinematic example website for the `cinematic-scroll` skill.

## What it demonstrates

- Two real, independently encoded and frame-matched video layers.
- A continuously playing monochrome base video.
- A synchronized full-colour video above it.
- Scroll-scrubbed CSS radial-gradient masking: five soft colour blooms open cumulatively over each mechanical system as the scan plane crosses it, then a full-frame wash floods the whole unit in colour.
- Frame-by-frame drift correction using `requestVideoFrameCallback`, playback-rate convergence and buffered hard-resync protection.
- A genuinely full-viewport video stage using `object-fit: cover`; no framed media panel or transformed 3D ancestor.
- Generated precision-mechanical hero imagery converted into a seamless 11.667-second, 30 fps, 1440p master loop — the seam is crossfaded over 10 frames so the wrap is invisible, and both layers are encoded from one processed master for guaranteed frame alignment.
- Velocity-reactive playback: scrolling accelerates the loop up to ~1.9×, easing back to 1× at rest; the loops pause off-screen and resume in sync.
- Muted inline autoplay plus pointer, touch, wheel, scroll, visibility and page-show recovery hooks.
- Five selectable mechanical systems with live readings and macro crops.
- Procedural Web Audio ambience behind an explicit user-controlled sound toggle.
- A complete website after the hero: system catalogue, calibration protocol and closing chapter.
- Mobile and `prefers-reduced-motion` fallbacks.

## Video assets

| Asset | Role | Specification |
|---|---|---|
| `kern-mono.mp4` | Persistent base layer | 2560×1440, 30 fps, 11.667 s, H.264, seamless crossfaded loop |
| `kern-color.mp4` | Scroll-masked colour layer | 2560×1440, 30 fps, 11.667 s, H.264, seamless crossfaded loop |
| `kern-calibration-unit.png` | Poster and macro source | Generated precision-mechanical plate |

Both videos are encoded in a single pass from one debanded, upscaled and sharpened colour master (the monochrome layer is a desaturated grade of the same stream), so framing, duration, frame count and camera motion are identical by construction.

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
python3 examples/kern-calibration/test-video-motion.py
```
