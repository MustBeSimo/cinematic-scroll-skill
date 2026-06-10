# 3D Stack

> 3D is the most expensive thing you can put on a scroll page. The default answer is
> **tier A: no 3D.** Earn each step up the ladder with a reason, not a vibe.
> Every constraint below is a hard limit. Deviation requires written justification and
> sign-off — same rule as `performance-budget.md`.

The performance budget does not relax because you reached for WebGL. A 3D chapter lives
inside the *same* 16.67ms frame as everything else: GSAP scrub, parallax movers, reveals.
The renderer gets a slice of that budget, not a waiver from it.

---

## 1. The Decision Tree

Pick the **lowest** tier that satisfies the narrative. Climbing a tier multiplies cost
(bundle, GPU memory, battery, asset-production time, failure surface). You do not get to
skip tiers for taste — you get to skip them for *budget*.

```
Does the story actually need real 3D depth / rotation / parallax-in-space?
│
├─ NO  ──────────────────────────────────────────────►  TIER A  (GSAP / CSS only)
│       Fake depth with layered transforms + CSS 3D. 95% of cinematic
│       scroll pages live here. See scroll-patterns.md #1, #6, #7.
│
└─ YES → Do you have (or can you commission) a real model?
         │
         ├─ YES, a discrete object/scene/figure  ────►  TIER B  (Three + GLB)
         │        A product, an environment, an avatar. Asset-driven.
         │        Needs ASSETS-3D.md hand-off + a manifest.
         │
         └─ NO model — the visual IS the math  ───────►  TIER C  (Three + shaders)
                  Fields, flows, particles, generative surfaces.
                  Zero external assets. Procedural.

         …and on top of B or C, only if there is a real reason a flat
         screen cannot deliver the moment (scale, presence, embodiment):
                                          ────────────►  TIER D  (+ WebXR)
                  Immersive VR / room-scale AR. See references/webxr.md.
```

### Tier A — GSAP / CSS only, no 3D

**Use when:** the depth is illusory and a screen is the final medium. Pinned heroes,
parallax galleries, the "3D Product Orbit" pattern (which is *CSS* `rotateY` on layered
images, not a mesh), chaptered releases, editorial longreads. If a designer says "make it
feel 3D," this is almost always the correct answer.

- **Cost:** the existing transform/opacity budget. No new dependencies.
- **Ships today, everywhere, with zero WebGL risk.** No context-loss handling, no
  feature detection, no fallback poster — the page *is* the fallback.
- **Decision rule:** if you cannot name a specific thing the user does that *requires* a
  camera moving through real geometry (orbit an object freely, look around a space, walk
  up to a figure), stay here.

### Tier B — GSAP + Three.js + GLB model

**Use when:** there is a discrete hero artifact whose form carries the story — a product,
an environment, a character — and a flat image sequence would be a worse, heavier, or
less flexible version of it.

- **Asset-availability gate:** you must have the GLB, or a committed path to it. Until it
  arrives, ship the **procedural placeholder** (a tier-C stand-in) so the chapter is alive
  today — see §7. Never block the build on an asset.
- **Perf budget:** triangle / draw-call / texture caps in §3. A GLB is not a license to
  blow the frame.
- **Narrative gate:** "the user orbits / inspects / configures the thing" or "the camera
  flies through the place." If the user only *looks* at it from one angle, that's a render
  (an image), not a tier-B scene.

### Tier C — GSAP + Three.js + procedural shaders

**Use when:** the visual *is* the computation — a field, a flow, a surface, a particle
system — and there is no object to model. Abstract chapters, data-as-texture, generative
backdrops.

- **Zero external assets.** This tier always runs today; it is the procedural backbone the
  whole flagship leans on. Tier-B chapters fall back *to a tier-C placeholder* when their
  GLB is missing.
- **Perf budget:** shader cost is per-pixel; a full-screen fragment shader on a Retina
  panel is `width × height × dpr²` invocations per frame. The `devicePixelRatio` clamp in
  §3 is non-negotiable here.
- **Decision rule:** prefer C over B whenever the look survives without a named object.
  Procedural is cheaper to ship, impossible to 404, and degrades by lowering resolution
  rather than by going blank.

### Tier D — any of B/C + WebXR immersive

**Use when:** flatness is the actual limitation — the moment needs *scale* (stand inside
the world), *presence* (the object at 1:1 in your room), or *embodiment* (meet the
figure). Not "because we can." VR/AR is a session the user explicitly enters; it is never
the default render path.

- **Gates, all required:** feature-detection passes (`navigator.xr`), an Enter-XR
  affordance the user chooses, comfort rules honored (no forced locomotion, stable
  horizon, exit always reachable). Full setup in `references/webxr.md`.
- **The 2D page must be complete on its own.** XR is additive. A user who never enters a
  headset must lose nothing.
- **Device-target rule:** XR is opt-in per session and per device. The same build serves a
  desktop with no XR, a phone doing AR quick-look, and a headset doing immersive VR —
  feature detection routes each one.

### Decision criteria, summarized

| Criterion | A | B | C | D |
|---|---|---|---|---|
| Real model required | no | **yes** | no | inherits B/C |
| External assets | none | GLB (+USDZ for AR) | none | inherits |
| Runs today with zero assets | yes | via placeholder | yes | via placeholder |
| New bundle weight | 0 | ~150KB+ (three + GLB) | ~150KB (three) | + ~20–40KB (XR) |
| Narrative need | faux depth | inspect / fly-through | the math is the visual | scale / presence / embodiment |
| Failure surface | none | WebGL + asset | WebGL | WebGL + XR session |
| Battery cost | low | medium–high | medium–high | highest |

When two tiers both satisfy the story, ship the lower one. "Could be 3D" is not "should be
3D."

---

## 2. Pinned Versions

> **Pin every version. Exactly. No `latest`, no floating majors on the renderer.**
> Three.js makes breaking changes between minors; drei and the R3F ecosystem track Three's
> internals closely. An un-pinned 3D stack is a future blank chapter. This is a build-time
> failure mode, so it is a *taste* failure too.

The pinning rule, stated explicitly:

- **Vanilla Three.js: pin to an exact patch** (`0.160.0`) and load it from a versioned
  CDN URL via an import map. The URL *is* the lockfile.
- **React stack: pin with a caret on the wrappers** (`^9.x`, `^10.x`, `^6.x`) but pin Three
  itself, and let the package manager's lockfile freeze the resolved tree. The caret is
  acceptable on wrappers because they follow semver; Three does not, so Three is exact.
- **Never upgrade the renderer without re-running the full device matrix** (see
  `performance-budget.md` §4). A Three minor bump is a regression-test event.

### Canonical pins

| Package | Version | Stack | Notes |
|---|---|---|---|
| `three` | `0.160.0` | both | **exact**, no caret. The whole stack pivots on this. |
| `@react-three/fiber` | `^9.0` | R3F | React renderer for Three. **v9 is the React 19 line** (v8 is React 18 — using v8 with React 19 fails to resolve). |
| `@react-three/drei` | `^10.0` | R3F | Helpers: `ScrollControls`, `useScroll`, `Environment`, loaders. **v10 pairs with R3F v9** (v9 pairs with R3F v8). |
| `@react-three/xr` | `^6.6` | R3F | v6 API: `createXRStore`, `<XR>`, `<XROrigin>` (NOT the old `<VRButton>`/`useXR` v5 shape). Peers `@react-three/fiber >=8`. |
| `@google/model-viewer` | `3.4.0` | both | `<model-viewer>` web component for AR quick-look on phones. **Pinned exact:** 3.4 peers `three ^0.160`; 3.5 demands `three ^0.163` and would force a Three bump. |

> **React 19 / Three coupling (the gotcha that bites first).** On a React 19 + Next 15
> project, the 3D wrappers must be the React-19 majors — `@react-three/fiber@^9` +
> `@react-three/drei@^10`. Using v8/v9 (the React-18 line) throws `ERESOLVE` on install.
> Separately, `@google/model-viewer@3.5` raised its Three peer to `^0.163`; staying on
> `three@0.160` means pinning model-viewer to `3.4.0` exactly. Both facts are enforced by
> `templates/nextjs/package.json` and verified by `npm install && npm run build`.

> **`@react-three/xr` major-version warning.** v6 is a hard rewrite of v5. If a tutorial
> shows `<VRButton />`, `<DefaultXRControllers />`, or `<XR>` without a `store` prop, it is
> v5 and will not compile against `^6`. The v6 shape is in §6 and in `references/webxr.md`.

### Vanilla import map (Mode A — single file, `file://`-runnable)

Three ships ES modules. Use an **import map** so `import { ... } from 'three'` and
`'three/addons/...'` resolve to pinned CDN URLs. No bundler, no `npm install`, runs from
`file://`.

```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
  }
}
</script>
<!-- model-viewer is a self-registering web component, not an import-map module -->
<script type="module"
  src="https://unpkg.com/@google/model-viewer@3.4.0/dist/model-viewer.min.js"></script>

<script type="module">
  import * as THREE from 'three';
  import { GLTFLoader }  from 'three/addons/loaders/GLTFLoader.js';
  import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
  import { VRButton }    from 'three/addons/webxr/VRButton.js';
  import { ARButton }    from 'three/addons/webxr/ARButton.js';
  // ...scene setup
</script>
```

- The `three/addons/` trailing-slash mapping is required — it lets every
  `three/addons/<path>` resolve under the same pinned version. **The version appears in
  three places (three, addons, model-viewer); they must match.**
- `unpkg.com` and `cdn.jsdelivr.net` both serve these paths; pick one and keep it
  consistent (mixing CDNs duplicates Three in memory if the URLs differ).
- For a production build, mirror these into the bundle and drop the import map — but the
  *pins stay identical*.

---

## 3. Performance Caps

These sit on top of `performance-budget.md`, not beside it. The 3D scene is one more thing
competing for the same 16.67ms.

### Renderer caps

| Cap | Value | Why |
|---|---|---|
| `devicePixelRatio` clamp | `Math.min(window.devicePixelRatio, 2)` | DPR 3 on phones = 9× the fragment work for invisible gain. **Mandatory.** |
| Antialiasing | MSAA only at DPR 1; off or FXAA at DPR ≥ 2 | MSAA × high DPR is a budget bomb. |
| Renderer instances | **1 per page** | One `WebGLRenderer`, one canvas. Reuse it across chapters. |
| `powerPreference` | `'high-performance'` desktop, default mobile | Don't force the discrete GPU on a phone. |
| Tone mapping / color | `ACESFilmicToneMapping`, `SRGBColorSpace` output | Cinematic look; set once. |

### Draw-call & geometry budget (per chapter, on screen at once)

| Tier / chapter | Draw calls | Triangles | Textures |
|---|---|---|---|
| Tier B — Object | ≤ 60 | **≤ 150k** | ≤ 6 |
| Tier B — World (whole scene) | ≤ 150 | **≤ 500k total** | ≤ 12 |
| Tier B — Figure | ≤ 40 | **≤ 80k** | ≤ 5 |
| Tier C — Field (procedural) | ≤ 10 | none (full-screen quads / instanced) | ≤ 2 |

These are the same numbers `ASSETS-3D.md` hands to the modeler. The doc and the runtime
agree on the budget; if a delivered GLB exceeds it, it is rejected at the door, not
optimized at runtime.

### More caps

- **Texture size:** ≤ 2048×2048 per map (≤ 1024 on mobile). Power-of-two. KTX2/Basis
  compressed where available; otherwise WebP/JPEG decoded to GPU.
- **Frustum culling:** leave `mesh.frustumCulled = true` (Three's default). Never disable
  it to "fix" a pop-in — fix the bounding box instead.
- **Instancing for repeats:** anything appearing > 8 times (trees, particles, props) must
  be an `InstancedMesh` or instanced geometry. N separate meshes = N draw calls = budget
  gone.
- **Dispose on unmount:** WebGL resources are not garbage-collected. On chapter teardown /
  route change, call `geometry.dispose()`, `material.dispose()`, `texture.dispose()`, and
  `renderer.dispose()`. Leaks here are the "tab memory grows > 50MB" failure in
  `performance-budget.md` §6.
- **Pause RAF when hidden / off-screen:** stop the render loop on
  `document.visibilitychange` (tab hidden) AND when the canvas is out of the viewport
  (IntersectionObserver on the canvas container). A 3D loop running behind chapter 7 while
  the user reads chapter 2 is wasted battery and a dropped-frame risk.

```js
// Render only when visible AND on-screen. Reuse one renderer.
let onScreen = true, tabVisible = true;
const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }, { threshold: 0 });
io.observe(canvas.parentElement);
document.addEventListener('visibilitychange', () => { tabVisible = !document.hidden; });

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // hard clamp

function loop() {
  if (onScreen && tabVisible) renderer.render(scene, camera);
  requestAnimationFrame(loop); // cheap to keep the rAF; expensive part is gated
}
// In XR, hand the loop to the headset compositor instead — see §5 / webxr.md.
```

---

## 4. Fallback Rules

A 3D chapter has more ways to fail than a CSS one, so it needs more ways to degrade. Every
tier-B/C/D chapter ships **all** of these.

### WebGL feature detection (before creating a context)

```js
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}
if (!hasWebGL()) showPosterFallback();   // never construct the renderer
```

### Context loss / restore

A WebGL context can be lost at any time (GPU reset, OS memory pressure, backgrounded tab on
mobile). Unhandled, the chapter goes black and stays black. **Both handlers are mandatory.**

```js
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();           // REQUIRED — without this the context never restores
  stopRenderLoop();
  showPosterFallback();         // graceful, not a black hole
}, false);

canvas.addEventListener('webglcontextrestored', () => {
  rebuildGLResources();         // re-upload geometry/textures (they were freed)
  hidePosterFallback();
  startRenderLoop();
}, false);
```

### The poster / CSS fallback

Every 3D chapter has a **static poster** behind the canvas — a representative still (a
procedural CSS gradient/figure for tier C, a rendered hero still for tier B). It shows:

- before WebGL inits (and forever if WebGL is absent),
- during context loss,
- under `prefers-reduced-motion`,
- on the budget mobile tier if the scene is too heavy.

The poster is not a placeholder for "later" — it is a permanent member of the chapter, the
floor the experience never drops below. This is the 3D equivalent of the CSS-placeholder
discipline the example sites already follow.

### prefers-reduced-motion → static frame

```js
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Tier B/C: render ONE frame at the chapter's hero camera angle, then stop the loop.
  renderOnce();           // a single, composed, motionless frame — not a blank canvas
  // Tier D: do not surface the Enter-XR button at all.
}
```

Reduced motion does not mean *blank* — it means *still*. Compose one good frame and hold it.
(See `performance-budget.md` §3 Tier 4 — content must be fully present without motion.)

### Mobile → lower pixelRatio + simpler scene

Drive off the tier from `getPerformanceTier()` in `performance-budget.md` §3:

| Tier | pixelRatio | Scene |
|---|---|---|
| desktop / flagship | clamp ≤ 2 | full draw-call & poly budget |
| mid-range | ≤ 1.5 | 70% poly budget; drop shadows / post |
| budget | ≤ 1 | static poster, or a single low-poly hero, no post |
| reduced | — | static poster / single rendered frame |

Shadows, post-processing, and reflection probes are the first things to cut on mobile —
they are multiplicative with resolution. Cut them before you cut geometry.

---

## 5. The Scroll-Camera Pattern

The signature move of a cinematic 3D chapter: **scroll drives the camera**, not the user's
mouse. Scroll progress (already governed by GSAP ScrollTrigger / the page's scroll model)
maps to a camera position along a path or an orbit angle. Same scrub discipline as every
other pattern — cached values, no layout reads in the update, lerped for smoothness.

### Vanilla Three (Mode A)

ScrollTrigger owns scroll; it writes a normalized `progress` (0→1) that the render loop
reads. The render loop lerps the camera toward the scroll-derived target and renders. Two
loops, one source of truth.

```js
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// Camera waypoints for the chapter (positions a CatmullRom curve passes through).
// In a real chapter these come from the manifest's cameraNodes (see ASSETS-3D.md).
const path = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 1.6, 6),
  new THREE.Vector3(4, 2.0, 2),
  new THREE.Vector3(0, 1.6, -4),
]);
const lookAt = new THREE.Vector3(0, 1, 0);

let target = 0;           // scroll-derived 0→1 (written by ScrollTrigger)
let current = 0;          // lerped value the camera actually uses

ScrollTrigger.create({
  trigger: '.chapter-3d',
  start: 'top top',
  end: '+=300%',          // pin length = camera-move length
  pin: true,
  scrub: 0.5,             // same scrub contract as performance-budget.md §7
  onUpdate: (self) => { target = self.progress; }, // NO layout reads here
});

function render() {
  current += (target - current) * 0.1;          // lerp — buttery under fast scroll
  path.getPointAt(current, camera.position);     // reuse vector, no allocation per frame
  camera.lookAt(lookAt);
  if (onScreen && tabVisible) renderer.render(scene, camera); // gated (see §3)
  requestAnimationFrame(render);
}
render();
```

- **ScrollTrigger writes a number; the render loop reads it.** Don't render inside
  `onUpdate` — let the rAF loop own the frame so scrub-lag and the lerp compose smoothly.
- **No allocation in the loop.** `getPointAt(t, target)` writes into the existing vector;
  `new Vector3()` every frame is GC pressure → jank.
- On reduced motion: set `current = target = heroT` once, call `render()` a single time,
  don't start the loop.

### R3F equivalent — `ScrollControls` / `useScroll` (drei)

In React, drei's `<ScrollControls>` creates the scroll container and `useScroll()` exposes
`offset` (0→1) and per-range helpers. Same idea, declarative.

```tsx
'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { ScrollControls, useScroll } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

const path = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 1.6, 6),
  new THREE.Vector3(4, 2.0, 2),
  new THREE.Vector3(0, 1.6, -4),
]);
const lookAt = new THREE.Vector3(0, 1, 0);

function ScrollCamera() {
  const scroll = useScroll();              // .offset is 0→1 across the scroll range
  const current = useRef(0);
  useFrame(({ camera }) => {
    current.current += (scroll.offset - current.current) * 0.1; // lerp
    path.getPointAt(current.current, camera.position);
    camera.lookAt(lookAt);
  });
  return null;
}

export default function Chapter3D() {
  return (
    <Canvas
      dpr={[1, 2]}                          // pixelRatio clamp ≤ 2 (§3)
      gl={{ powerPreference: 'high-performance' }}
      camera={{ position: [0, 1.6, 6], fov: 45 }}
    >
      <ScrollControls pages={3} damping={0.2}>{/* pages ≈ pin length */}
        <ScrollCamera />
        {/* chapter scene… */}
      </ScrollControls>
    </Canvas>
  );
}
```

- `dpr={[1, 2]}` is the R3F form of the pixelRatio clamp — **always set it.**
- `useScroll().offset` ↔ ScrollTrigger's `self.progress`. The choreography is identical;
  only the host differs. This is the "one choreography, two media" rule applied to 3D.
- R3F auto-disposes GPU resources when components unmount and pauses `useFrame` when the
  canvas is hidden (`frameloop="demand"` for fully event-driven scenes) — but you still
  own disposing anything you create imperatively.

---

## 6. WebXR entry points (pointer)

Tier D session setup, comfort, and AR quick-look live in **`references/webxr.md`** so this
file stays the *selection* reference. The one rule that belongs in both: **feature-detect
before you offer the button.**

```js
// Vanilla (three/addons): gate the button on real support
if (navigator.xr && await navigator.xr.isSessionSupported('immersive-vr')) {
  document.body.appendChild(VRButton.createButton(renderer)); // sets renderer.xr.enabled
}
```

```tsx
// R3F (@react-three/xr v6): createXRStore + <XR>, enter via store
import { createXRStore, XR } from '@react-three/xr';
const store = createXRStore();
// <button onClick={() => store.enterVR()}>Enter VR</button>
// <Canvas><XR store={store}>{scene}</XR></Canvas>
```

Full setup, comfort/safety, and `<model-viewer>` AR: `references/webxr.md`.

---

## 7. Procedural-placeholder discipline

The whole 3D layer follows the same contract as the image layer (`IMAGE-SPEC.md`): **runs
today, zero assets, real files drop in with no code change.**

- A tier-B chapter renders a **procedural stand-in** (a parametric primitive with the
  right silhouette, PBR material, and pivot) until its GLB exists. The chapter is fully
  alive — scroll-camera, lighting, fallback, mobile path all working — before a single
  asset is delivered.
- The swap is **data, not code.** The chapter reads `assets-3d/manifest.json`; when an
  entry's `model` resolves (file present, loads clean), the real GLB replaces the
  placeholder. When it 404s, the placeholder stays. No conditional branches in chapter
  logic — the loader decides.
- This is why tier C is the backbone: the placeholders *are* tier-C geometry. The flagship
  ships complete on day one and gets richer as `ASSETS-3D.md` deliverables arrive.

See `ASSETS-3D.md` for the per-chapter spec, the conversion path, and the manifest schema.
```
