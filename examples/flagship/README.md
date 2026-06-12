# Flagship — AETHER · "Four Movements"

The **flagship** demo for **cinematic-scroll** and the public proof the skill produces
best-in-class output. One scroll-driven cinematic narrative, **one shared WebGL
renderer / scene / canvas**, and a camera that travels between **four chapters** as you
scroll — built in **vanilla Three.js** (Tier B/C/D of `references/3d-stack.md`) with
**no build step and no npm install**. It ships **real Draco-compressed meshes** — a fal.ai-generated chronometer, a colonnade hall, and a **Mixamo-rigged dancer** (samba plays out of the box, root motion stripped) — and **degrades to designed procedural geometry** when opened from `file://` or offline, so it never breaks.

Visual system: **Atmospheric Sublime × Temporal Monument** — vast negative space, deep
cobalt/violet atmosphere, a single **electric-cyan** edge-light accent, slow revelation.
Fictional studio (**AETHER**) — no real products, people, or brands.

## The four movements (chapters)

1. **OBJECT** — premium product showcase. A parametric **faceted beveled prism**
   ("watch-like" form) in **PBR metal/rough**, slow auto-rotate + scroll-driven
   **explode/reassemble**, lit by a procedural env map. AR quick-look ready
   (`<model-viewer>`, feature-detected).
2. **WORLD** — environment fly-through. An **instanced** modular hall (colonnades +
   coffered beams + drifting motes — one draw call per type), scroll **dolly** along the
   chapter path, atmospheric `FogExp2`. **WebXR Enter-VR** (feature-detected).
3. **FIELD** — abstract procedural **shader**. A full custom `ShaderMaterial` (GLSL):
   a domain-warped flow field on the GPU reacting to scroll progress. **Zero assets** —
   this is the **always-works hero** chapter; it degrades by lowering resolution, never
   by going blank.
4. **FIGURE** — avatar. A stylized **humanoid built from primitives** (capsules +
   sphere + a cyan visor band) with a gentle **idle** (breathing weight-shift). WebXR +
   AR quick-look. A real rigged `.glb` drops in via the manifest with zero code change.

## Run it / preview

```bash
python3 -m http.server 8099    # then open http://localhost:8099/examples/flagship/
# …or just open index.html directly in a browser (file:// works).
```

Three.js and `@google/model-viewer` load from a **CDN via `<script type="importmap">`**
at **pinned versions** (`three@0.160.0`, `@google/model-viewer@3.4.0` — see
`references/3d-stack.md` §2). If the CDN is unreachable, the designed **CSS fallback**
stands in and the page stays whole.

## Files

| File | Role |
|---|---|
| `index.html` | Semantic landmarks, viewport, the import map + model-viewer, the **boot** script (WebGL / reduced-motion / XR feature-detection, DPR clamp, context-loss handlers), and critical CSS. |
| `main.js` (`type=module`) | The engine and the four chapters — one renderer, the scroll-camera, all procedural placeholders, the GLSL field, and the manifest upgrade path. |
| `styles.css` | The full visual system. |
| `assets-3d/manifest.json` | The 3D hand-off manifest (schema in `ASSETS-3D.md`). Ships real `.glb` paths for object/world/figure (+ `height`, `spin`, `stripRootMotion`); set any back to `"procedural"` for the zero-asset path — **zero code change**. |

## Real meshes by manifest — procedural by fallback

The engine fetches `assets-3d/manifest.json`; for any chapter whose `runtime` path
resolves and loads clean, the real GLB replaces the placeholder (`GLTFLoader` +
`DRACOLoader`, lazy-imported only when a real model exists). Loaded models are
**auto-normalized** to the manifest's `height` with a **pose-aware bounding box**
(bind-pose boxes lie for rigged exports), their clips play through an
`AnimationMixer`, and `stripRootMotion` keeps a Mixamo dance planted on its mark.
A `"procedural"` runtime, a 404, or an offline `file://` open all keep the designed
placeholder — no per-chapter `if`, no broken state. See `ASSETS-3D.md` for the spec.

## The FX layer (zero assets, pure GLSL/geometry)

- **Rail dust** — one `THREE.Points` cloud spanning the whole camera rail, one draw
  call, **scroll-velocity reactive**: motes swell + brighten in transit and settle at
  every dwell, while the lens **FOV kicks** +6° at speed. Point size is hard-capped so
  a mote passing the lens reads as a spark, never a bokeh blob.
- **Fake-volumetric light shafts** — open cones with beam falloff + organic flicker:
  two cool ceiling lights raking the hall, one warm concert spotlight on the dancer.
- **Breathing stage rings** — emissive cyan/ember rings under the object and figure.
- All damping is **time-based** (`1 − e^(−k·Δt)`), so pacing is identical at 60 Hz,
  120 Hz, and under load; reduced motion composes one still frame.

## Engineering contract (enforced by `cinematic-doctor`)

- **`devicePixelRatio` clamped ≤ 2** (≤ 1.5 on mobile); one `WebGLRenderer`, reused.
- DOM overlays animate **transform / opacity only**; the **3D camera moves on rAF only**
  (no layout in the hot path).
- **`webglcontextlost` + `webglcontextrestored`** handlers — a lost GPU context shows the
  fallback instead of going black; a restored one rebuilds and resumes.
- **WebGL feature-detected** before any context is constructed; unsupported → a designed
  **CSS poster fallback** (never a broken/black canvas).
- **XR feature-detection** (`navigator.xr` / `isSessionSupported()`) resolves **before**
  any Enter-VR / View-in-AR button is shown — never a dead button. Immersive XR is not
  offered under reduced motion (comfort, `references/webxr.md`).
- **`prefers-reduced-motion`** → the engine renders **one static frame** and stops; no
  continuous animation anywhere.
- rAF **pauses when the tab is hidden** and resumes on return.
- Geometries / materials / textures are tracked and **disposed** on teardown; object
  counts (segments, bays, motes) are **capped**, and **reduced on mobile**.
- Fully **responsive**: mobile gets a static stacked layout, fewer layers, lower DPR.

> `cinematic-doctor` score: **100 / 100** (`node tools/cinematic-doctor/index.mjs
> examples/flagship/index.html`).

Deploys as-is to GitHub Pages at
`https://mustbesimo.github.io/cinematic-scroll-skill/examples/flagship/` — all paths are
relative.
