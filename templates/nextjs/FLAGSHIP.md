# Flagship route — `/flagship` (Mode B: React Three Fiber + WebXR)

The 3D twin of the vanilla Mode-A flagship in `examples/flagship/`, ported to this
Next.js template as a route. **One Canvas, one renderer, one scene graph**; the camera
travels between four movements as you scroll. Same choreography, different medium —
see `references/3d-stack.md` §5 ("one choreography, two media").

Open `/flagship` after `npm run dev`.

## The four movements

| Chapter | Tier | What it is |
|---|---|---|
| **Object** | B | Procedural faceted prism (PBR metal/rough), scroll-driven explode/reassemble. `useGLTF` swaps in a real `.glb` when present. AR quick-look ready. |
| **World** | B | Instanced colonnade hall (one `instancedMesh` per type) the scroll-camera flies through. |
| **Field** | C | A full custom GLSL `shaderMaterial` — a domain-warped flow field. **Zero assets**, the always-works hero. Reused verbatim from `examples/flagship/main.js`. |
| **Figure** | B | Primitive humanoid with a gentle idle; real rigged `.glb` + clips drop in via the manifest. AR + VR. |

## Files

| Path | Role |
|---|---|
| `app/flagship/page.tsx` | Route (Server Component) → renders the client root. |
| `components/flagship/FlagshipRoot.tsx` | `'use client'` boundary + degradation gate (no-WebGL → poster, reduced-motion → still frame, mobile → lighter). Lazy-loads the Canvas (`ssr:false`). |
| `components/flagship/FlagshipScene.tsx` | The Canvas: `<ScrollControls>`/`useScroll` scroll-camera rig, `<XR store>` + `<XROrigin>`, `<Environment>`, the four chapters, the HTML rail via `<Scroll html>`, and the cinematic finish (bloom + vignette — desktop only, suspended while an XR session presents). |
| `components/flagship/FlagshipOverlay.tsx` | HTML copy + feature-gated Enter-VR/AR buttons + a reachable Exit affordance. |
| `components/flagship/ModelViewer.tsx` | `<model-viewer>` AR quick-look (phones); lazy-registers the pinned web component. |
| `components/flagship/chapters/*` | One file per movement. Each `useGLTF`s a real model when present, else renders procedural geometry — the swap is **data, not code**. |
| `components/flagship/fx/RailDust.tsx` | One velocity-reactive GPU dust field spanning the whole rail (single draw call) — motes swell + stream in transit, settle at dwells. |
| `components/flagship/fx/Aurora.tsx` | Flowing fbm light curtains high above the rail (additive blending, desktop only). |
| `components/flagship/fx/LightShaft.tsx` | Fake-volumetric beam cone (fresnel rim fade + organic flicker) — the colonnade lights and the dancer's spotlight. |
| `lib/flagship-velocity.ts` | Scroll-velocity bus: the camera rig writes damped travel speed each frame, the FX layer reads it (no React state in the hot path). |
| `lib/normalize-model.ts` | Auto-normalizes any loaded GLB to chapter height, base on floor — **pose-aware for skinned/rigged meshes** (bind-pose bboxes lie). |
| `lib/flagship-manifest.ts` | Chapter copy + the 3D asset manifest (same schema as `ASSETS-3D.md` §6). |
| `lib/flagship-xr.ts` | The shared `createXRStore()` + `useEnterXR()` (v6) — imported by both the Canvas and the overlay (no circular dep). |
| `lib/use-xr-support.ts` | `navigator.xr` feature-detection — gates every Enter-XR button (`references/webxr.md` §1). |

## Dependencies (pinned — `references/3d-stack.md` §2)

Already added to `package.json`. **Do not float the renderer.**

```jsonc
"three": "0.160.0",            // EXACT — the whole stack pivots on this
"@react-three/fiber": "^9.0.0",          // v9 = the React 19 line (v8 is React 18)
"@react-three/drei": "^10.0.0",          // v10 pairs with fiber v9
"@react-three/xr": "^6.6.0",  // v6 API: createXRStore + <XR store> + <XROrigin>
"@react-three/postprocessing": "^3.0.0", // bloom/vignette finish (desktop only)
"@google/model-viewer": "3.4.0",         // EXACT — 3.5 demands three ^0.163
// dev: "@types/three": "0.160.0"  // pinned to match three
```

Then `npm install` (this template does not vendor `node_modules`).

## Generate real 3D assets with fal.ai (one command)

With `FAL_KEY` in `.env.local` (same key the image pipeline uses):

```bash
npm run generate:flagship:dry         # print the art-directed prompts, no API calls
npm run generate:flagship             # object + world + figure → .glb + concept.jpg
npm run generate:flagship -- --apply  # …and patch the manifest runtime paths
```

Two stages per chapter: a concept image (default `fal-ai/nano-banana-2` —
reasoning-guided, strong at accurate single-object renders; switch with
`--image-model fal-ai/flux-2-pro`), then image→3D via fal's **queue API**
(default `fal-ai/trellis`; for high-detail hero objects prefer
`--mesh-model fal-ai/hyper3d/rodin`, or `--mesh-model fal-ai/hunyuan3d/v2`).
Each saved mesh is then **auto-compressed in place** (Draco geometry + WebP
textures via `@gltf-transform/cli`), taking a 10–13 MB raw mesh down to ~1–3 MB
with no visible quality loss — drei's `useGLTF` decodes Draco by default and
WebP textures load natively, so it's zero code change. Pass `--no-optimize` to
keep the raw output. Field is skipped —
its shader is the asset. Loaded models **auto-normalize** to chapter height
with their base on the floor (`lib/normalize-model.ts`), so arbitrary generated
scales/offsets are safe.

**The Figure dances out of the box.** Image-to-3D models output *unrigged*
meshes, so the template ships a rigged, animated character at
`public/flagship/figure/dancer.glb` (Mixamo-rigged, `SambaDance` clip, Draco'd
to ~0.8 MB) and the manifest points at it — no Blender, no Mixamo account, no
manual step. The generated android sculpture stays at `figure.glb`; to use it
instead, flip `figure.runtime` in `lib/flagship-manifest.ts`. To make *your own*
mesh dance, rig it via Mixamo (`ASSETS-3D.md` §4) and overwrite `dancer.glb` —
the chapter plays whatever clips the file carries.

## The immersive FX layer

The journey's air is never empty. All of it answers `prefers-reduced-motion`
with a composed still frame and respects the mobile budget:

- **Rail dust** — one GPU point cloud spanning the full camera rail (1700 motes
  desktop / 550 mobile, one draw call). It is *scroll-velocity reactive*: the
  camera rig publishes damped travel speed on `lib/flagship-velocity.ts`, and
  in transit the motes swell, brighten and stream while the lens FOV kicks
  +7° — travel feels like travel; every dwell settles back to stillness.
- **Aurora curtains** — three domain-warped fbm light ribbons flowing high
  above the rail (desktop only), tinted to the chapters they hang over.
- **Volumetric light shafts** — open cones with fresnel rim fade + organic
  flicker: staggered ceiling lights down the World colonnade, and a warm
  concert spotlight over the Figure.
- **Dynamic chapter dressing** — the hero artifact levitates (`Float`) with an
  orbiting comet glint (an exact analytic ghost-tail — smooth at any frame rate) and a breathing HDR stage ring; the dancer's
  ring pulses on a samba-ish beat; gold/cyan/ember motes per chapter.
- **Living atmosphere** — background, fog color **and fog density** morph per
  chapter (clean air for the Object, thick for the hall, near-vacuum for the
  Field, smoky for the Figure); the camera adds a barely-there hand-held
  breathing at dwell.
- **The finish** — blurred mirror floor, bloom over HDR emissives, chromatic
  aberration + film grain (desktop only, suspended in XR).

## Runs today with ZERO 3D assets

Every chapter renders procedural geometry. The manifest in `lib/flagship-manifest.ts`
has `model: null` for all four chapters. Point a chapter's `model`/`usdz` at a real file
in `public/` (e.g. `/flagship/object/object.glb`) and the loader swaps it in — **no code
change**. A `null` model, a 404, or no WebGL all degrade gracefully (poster / placeholder).

## Engineering contract honored

- `dpr={[1, 2]}` (1.5 ceiling on mobile) — pixelRatio clamp.
- WebGL feature-detected before any renderer is constructed; static poster otherwise.
- `prefers-reduced-motion` → one composed still frame, no loop; immersive XR not offered.
- Mobile → lower dpr, no shadows/AA/reflection plane.
- Suspense fallbacks per chapter; R3F auto-disposes GPU resources on unmount and pauses
  `useFrame` when the canvas is hidden.
- XR: buttons gated on `navigator.xr` detection; scroll-camera **freezes** while presenting
  (the headset owns the camera); a visible Exit affordance is always reachable.

## Hardened against the real world (found by capturing the live route headless)

Running the route in a strict, network-restricted headless Chromium surfaced
five production bugs — all fixed:

| Bug | Symptom | Fix |
|---|---|---|
| Cross-stage shader precision | `uVel`/`uTime` declared `highp` in vertex (default) but `mediump` in fragment — **program validation fails** on strict ANGLE/SwiftShader and some Android drivers | removed the manual `precision mediump float;` overrides; three injects matching `highp` into both stages of a `ShaderMaterial` |
| CDN Draco decoder | `useGLTF` pulled the decoder from `gstatic.com` at runtime — every GLB fails offline/intranet/blocked-CDN | decoder self-hosted at `public/draco/`, all `useGLTF(url, '/draco/')` |
| CDN HDR environment | `<Environment preset="city">` silently fetched `potsdamer_platz_1k.hdr` from a third-party CDN and **crashed the scene** when unreachable | procedural `<Lightformer>` studio in the route's palette — zero network |
| Float overshoot at rail end | `dwellEase` could return `1 + 1ulp`; `CatmullRomCurve3.getPointAt(t > 1)` indexes past its points array — **hard crash on the final chapter** | output clamped |
| Frame-rate-dependent damping | camera/FOV/parallax lerped by a per-frame factor — transit runs 2× faster at 120 Hz, never converges under load | time-based damping (`1 − e^(−k·Δt)`) everywhere |

The comet glint was also rebuilt from drei's `<Trail>` (per-frame sampling →
jagged web under load) to an exact ghost-tail evaluated analytically — smooth
at any frame rate.
