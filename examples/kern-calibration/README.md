# KERN — Precision Calibration

An original cinematic example website for the `cinematic-scroll` skill.

## What it demonstrates

- Scroll-scrubbed hero (the "Scrubbed Timeline" pattern): the video's time is driven by scroll position through a damped spring, so it glides fluidly with the scroll and springs to settle (with a touch of overshoot) when you stop; scrolling forward drives the camera's dolly-in, scrolling back reverses it.
- One decoded file, three frame-locked layers: the mono base, the colour scan and the macro crop all stream the SAME file and are driven to one shared `currentTime`, so they can never drift; the base is desaturated purely in CSS.
- Scroll-scrubbed CSS radial-gradient masking: five soft colour blooms open cumulatively across the mechanism as the scan plane advances, then a full-frame wash floods the whole unit in colour.
- A genuinely full-viewport video stage using `object-fit: cover`; no framed media panel or transformed 3D ancestor.
- A genuinely generated hero video: the still plate is animated by a fal.ai **Seedance 2.0** image-to-video model, so the exposed gears, escapement and central tourbillon actually turn while the camera performs a cinematic dolly-in — real motion, not a pan over a frozen image.
- A synced macro-optics panel: a moderate live crop of the very same scrubbed frame, phase-locked to the hero.
- Procedural Web Audio ambience behind an explicit user-controlled sound toggle.
- A complete website after the hero: system catalogue, calibration protocol and closing chapter — all scroll-choreographed (scrubbed, reversible entrances with per-card parallax depths, a drawing protocol timeline, and a dolly-in finale; transform + opacity only).
- Full-bleed on every viewport: mobile keeps the same sticky full-viewport video as desktop (panels become compact top-corner overlays), never a letterboxed band; plus a `prefers-reduced-motion` static fallback.

## Video assets

| Asset | Role | Specification |
|---|---|---|
| `kern-color.mp4` | The single scrubbed hero clip | 1920×1080, 24 fps, 12.04 s, H.264, dense keyframes (GOP 6) for smooth scroll-seeking |
| `kern-calibration-unit.png` | Source plate | Generated precision-mechanical still fed to the video model |
| `generate-i2v.py` | Primary generator | fal.ai Seedance 2.0 image-to-video → scrub-optimised H.264 encode + poster (needs `FAL_KEY`) |
| `render-mechanism.py` | Offline fallback | No-network single-still coherent camera move (used when no video model / key is available) |

There is only one video file: the mono base and colour scan are two `<video>` elements pointing at it, the base desaturated in CSS, so they share one decode-time and stay frame-locked with zero drift. The dense keyframe interval keeps `currentTime` scroll-seeking smooth. Regenerate with `FAL_KEY=<id:secret> python3 assets/generate-i2v.py`.

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
