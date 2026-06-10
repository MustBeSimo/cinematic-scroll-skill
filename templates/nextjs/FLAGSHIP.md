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
| `components/flagship/FlagshipScene.tsx` | The Canvas: `<ScrollControls>`/`useScroll` scroll-camera rig, `<XR store>` + `<XROrigin>`, `<Environment>`, the four chapters, and the HTML rail via `<Scroll html>`. |
| `components/flagship/FlagshipOverlay.tsx` | HTML copy + feature-gated Enter-VR/AR buttons + a reachable Exit affordance. |
| `components/flagship/ModelViewer.tsx` | `<model-viewer>` AR quick-look (phones); lazy-registers the pinned web component. |
| `components/flagship/chapters/*` | One file per movement. Each `useGLTF`s a real model when present, else renders procedural geometry — the swap is **data, not code**. |
| `lib/flagship-manifest.ts` | Chapter copy + the 3D asset manifest (same schema as `ASSETS-3D.md` §6). |
| `lib/flagship-xr.ts` | The shared `createXRStore()` + `useEnterXR()` (v6) — imported by both the Canvas and the overlay (no circular dep). |
| `lib/use-xr-support.ts` | `navigator.xr` feature-detection — gates every Enter-XR button (`references/webxr.md` §1). |

## Dependencies (pinned — `references/3d-stack.md` §2)

Already added to `package.json`. **Do not float the renderer.**

```jsonc
"three": "0.160.0",            // EXACT — the whole stack pivots on this
"@react-three/fiber": "^8.15.0",
"@react-three/drei": "^9.99.0",
"@react-three/xr": "^6.0.0",  // v6 API: createXRStore + <XR store> + <XROrigin>
"@google/model-viewer": "^3.5.0",
// dev: "@types/three": "0.160.0"  // pinned to match three
```

Then `npm install` (this template does not vendor `node_modules`).

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
