# NEXUS · IMMERSIVE LAB — Immersive Example

A fictional spatial-computing / XR studio portfolio page. The most technically ambitious example in the repo — built to showcase the cinematic-scroll skill's Tier C procedural-shader capabilities with an optional Tier D WebXR gate.

## What It Demonstrates

**Tier C — Procedural Shaders (Three.js r165)**

- **Galaxy Field** — 15,000 particles in a three-arm spiral. Custom `ShaderMaterial` with per-particle `aPhase` attribute for pulsing size (`sin(uTime + aPhase)`) and a fragment shader that renders a white-core / indigo-halo radial gradient per point using `gl_PointCoord`. The group rotates on Y at ~0.05 rad/s.
- **Signal Grid** — `PlaneGeometry(20,20,60,60)` wireframe. Vertex shader displaces Y with `sin(x*2+t)*sin(z*2+t)*0.3`; fragment shader lerps indigo → cyan by displacement height. Opacity driven by a `uOpacity` uniform that is scroll-bound: fades in at 20% scroll, out at 70%.
- **Particle Attractor** — 500 particles updated in JS each frame. A moving target orbits on a Lorenz-like path; each particle is attracted toward it with swirl and damping. Renders as amber additive-blended points. Visible only in Chapter 4.

**Tier D — WebXR Gate**

- `navigator.xr.isSessionSupported('immersive-vr')` is checked asynchronously on load.
- "ENTER VR" button is hidden by default; revealed only when `immersive-vr` is confirmed supported.
- `requestSession()` is always guarded — never throws on non-XR devices.

## Palette

| Token       | Value     | Role                        |
|-------------|-----------|-----------------------------|
| `--canvas`  | `#060812` | Deep near-black background  |
| `--indigo`  | `#4F3FFF` | Electric indigo — primary   |
| `--cyan`    | `#00FFF0` | Neon cyan — secondary       |
| `--amber`   | `#FF8C00` | Warm signal amber — accent  |
| `--white-fg`| `#F0F2FF` | Near-white type             |

## Page Structure

| Chapter | Section               | Scroll height |
|---------|-----------------------|---------------|
| 0       | Hero (galaxy backdrop)| 100vh         |
| 1       | Capabilities          | 300vh (pinned)|
| 2       | Signal Grid           | 250vh (pinned)|
| 3       | Projects (3 cards)    | free scroll   |
| 4       | Attractor Lab         | 200vh (pinned)|
| —       | Footer                | —             |

## Anti-Convergence (taste §4.5)

Five distinct entrance treatments — no two chapters share one:

1. **Word stagger** (`translateY → 0` + opacity) — Hero title
2. **Scale entrance** (`scale(1.08) → scale(1)`) — Capabilities heading
3. **Clip-path wipe** (`inset(0 100% 0 0) → inset(0 0% 0 0)`) — Capability cards + Lab title
4. **Letter-spacing scrub** (`0.6em → 0.3em`) — Signal Grid mono label
5. **Translate rise** (`translateY(30px) → 0`) — Signal Grid title + body

## Resilience

- **WebGL failure** — `canvas.getContext('webgl2')` check; on failure adds `.no-webgl` class which hides the canvas and shows a CSS radial-gradient fallback.
- **Context loss** — `webglcontextlost` (with `e.preventDefault()`) + `webglcontextrestored` rebuild.
- **Reduced motion** — CSS `@media (prefers-reduced-motion: reduce)` collapses all transitions to 1ms; JS `matchMedia` check stops the rAF loop after the first frame.
- **Mobile (≤768px)** — Three.js canvas hidden; CSS gradient fallback shown; GSAP scroll reveals still run.
- **rAF gates** — loop paused when `visibilityState === 'hidden'` and when canvas leaves viewport (`IntersectionObserver`).
- **noscript** — inline `<noscript>` style reveals all content for non-JS users.

## Doctor Score

```
taste        100/100
performance  100/100
a11y         100/100
mobile       100/100
threed       100/100
TOTAL        100/100  PASS
```
