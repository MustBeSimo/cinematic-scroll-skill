# Interaction runtime

All code in `runtime/` is MIT. Use it for a richer response to scrolling,
pointer movement or proximity. Choose effects that explain the subject; the lab
is a catalog of ingredients, not a mandatory page design. Studio adds learning,
not exclusive visual effects. Keep the user's brand and existing framework.

## Mode A: no build step

Copy `runtime/` beside the page and serve it over HTTP. The core and text/surface
effects have no dependencies. Import WebGL only when shader media is requested.

```html
<h2 data-cinematic-text="line-mask">An idea, unfolding.</h2>
<a href="#details" data-cinematic-proximity="magnetic">
  <span data-proximity-visual>Explore the details</span>
</a>
<div data-cinematic-distort="portal"><img src="poster.webp" alt="Product detail"></div>
<script type="module">
  import {createCinematicRuntime,mountDeclarativeEffects} from './runtime/index.mjs';
  const runtime = createCinematicRuntime(document);
  const unmount = mountDeclarativeEffects(document,runtime);
  const {createShaderLayer} = await import('./runtime/webgl.mjs');
  const layer = createShaderLayer(document,runtime);
  for (const el of document.querySelectorAll('[data-cinematic-distort]')) layer.add(el);
  // On route teardown: layer.dispose(); unmount(); runtime.dispose();
</script>
```

For a single-file deliverable run
`node /path/to/skill/tools/export-standalone.mjs index.html --out standalone.html`
after installing the skill's npm dependencies. It bundles local JS/CSS imports
and CSS assets. HTML images and remote fonts remain external: embed or self-host
those separately when offline delivery is required. Do not paste an unresolved
module graph into a file:// demo.
No enhancement may hide essential content before its dependency succeeds.
Use an explicit sized media box with a DOM poster. Cross-origin textures require
CORS; failure leaves the poster. The vanilla shader layer uses one viewport
canvas, scissored to axis-aligned surface rectangles, including their own rounded
corners. It does not reproduce transformed ancestors, nested overflow clips or
CSS filters. Use an in-flow canvas for those compositions, or keep the DOM image.

## Mode B: React

Use `templates/nextjs/lib/cinematic/react.tsx` and `three.tsx`; generated copies
come from `node tools/sync-runtime.mjs`. Never hand-edit both copies.

```tsx
import {CinematicProvider,TextChoreography,MagneticSurface} from '@/lib/cinematic/react';
export default function Story(){
  return <CinematicProvider>
    <TextChoreography as="h1" variant="line-mask">A clearer view.</TextChoreography>
    <MagneticSurface variant="depth"><div>Decorative product surface</div></MagneticSurface>
  </CinematicProvider>;
}
```

`useCinematicSignals(callback)` exposes a mutable ref; read it imperatively.
`useProximity(elementRef,{radius:120})` exposes rectangle-distance falloff.
`CinematicCanvas` requires a permanent `poster`, uses demand rendering, capped
DPR, ACES/sRGB, context recovery and optional `onDiagnostics` counters.
`DistortedMedia` is an R3F mesh **inside** that canvas, not a DOM image component.
`ScrollCameraRig` maps a direct scroll range onto a Catmull-Rom path. Give it at
least two points. It must not own a camera during an XR session.
Lazy-import the Three scene at a client boundary; text-only routes need no GPU
bundle. See the template's `/effects-lab` route for a runnable integration.

## Choose the response

| Treatment | Useful consequence | Constraints |
|---|---|---|
| `line-mask` | Reveal complete thought units | Re-split after fonts/width changes; preserve emphasis and breaks |
| `word-cascade` | Pace a short statement | Keep the readable hold longer than the entrance |
| `character-wave` | A small, tactile ripple | Short headlines only; grapheme-aware vanilla splitting |
| `velocity-skew` | Show momentum | Bounded skew, direct scroll; never distort body copy |
| `scramble` | Resolve uncertainty into clarity | Brief reveal, stable accessible name, no perpetual randomization |
| `variable-axis` | Shift typographic emphasis | Requires an actual variable font; bounded entrance, never continuously reflow text |
| `magnetic` / `depth` | A surface acknowledges approach | Fine pointer + hover only; transform a visual child, keep the control hit area stable |
| `displacement` | Local pressure on an image | Small displacement; preserve identifiable content |
| `refraction` | Inspect through a lens | Local bend/chromatic separation, no full-screen flashing |
| `atmosphere` | A slowly evolving field of light | Only loop while a visible surface needs it |
| `portal` | Reveal another view as the story progresses | Keep a useful static composition and a clear narrative reason |

React entrance variants use GSAP SplitText `autoSplit` and `onSplit` so font and
line changes retain lifecycle ownership. Vanilla uses semantic DOM wrappers and
restores the original nodes on cleanup. Nested interactive text is not split.
Do not continuously animate `letterSpacing` or `backgroundColor`: move/scale a
wrapper, or crossfade a background layer. Use live reduced-motion preference,
not a one-time check. A visible pause control can call `setQuality('static')`;
resume uses `setQuality('auto')`. Static means no split hiding, tilt, GPU loop or
scroll pinning; the authored DOM composition remains.

## One clock and one property owner

The core batches geometry reads before writes and sleeps when effects settle.
Subscribers may return `true` to request another frame. Persistent scenes obtain
and release `runtime.continuous(owner)` only while visible. Register pre-write
geometry in `runtime.read(fn)`. Call `refresh()` after layout or asset changes.
Scroll progress is normalized 0–1; velocity is px/s; pointer coordinates are
viewport pixels and normalized −1–1. Target proximity measures rectangle edges,
not just the center. The current cached target tracker assumes normal document
flow: refresh pinned/fixed/transformed target geometry as its layout changes.

React uses GSAP's ticker as the shared clock, removing its callback while idle.
In an existing clock integration use `{clock:'external',onWake}` and call
`runtime.tick(performance.now())` from that clock; the return value says whether
the runtime needs another frame. Do not add a second Lenis or renderer loop.
Wrap parallax, entrance and pointer visuals separately so they do not overwrite
each other's transforms. Signals are mutable: copy fields when saving history.

## Quality and evidence

### Assets and experimental rendering

`assets.tsx` provides renderer-scoped Draco/Meshopt/KTX2 GLTF loading, bounded
waits, cancellation that discards late results, and disposal of privately owned
textures/geometries/materials/image bitmaps. Copy decoder/transcoder files from
the pinned Three package to your own origin and pass `dracoPath` / `basisPath`.
Cancellation does not guarantee aborting decoder or subresource network work.
Never dispose a shared `useGLTF` cache with this utility. `createEnvironmentMap`
creates an owned PMREM target; the caller retains ownership of the source HDR.
Use glTF's texture color-space assignments; sRGB for color maps, linear for data.

`webgpu.tsx` is a separate experimental TSL study at `/webgpu-preview`. Its
WebGPURenderer selects WebGPU or WebGL2 automatically; device loss attempts the
WebGL2 fallback, then leaves the poster. It does not reuse ShaderMaterial,
legacy postprocessing or XR. Do not silently replace a working WebGL2 scene.
The standard template pins Three/types 0.185.0, not 0.186: postprocessing 6.39.4
declares Three <0.186. Model Viewer remains independently CDN-pinned for AR and
is not duplicated in the npm scene graph.

See [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) and
[KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html) for compression and
ownership details. Validate the real model, including failed decoder requests.

| Tier | DPR cap | Particle multiplier | Shadow budget | Post budget |
|---|---:|---:|---:|---|
| high | 1.5 | 1 | 1024 | full authored chain |
| balanced (initial) | 1.25 | .5 | 512 | bloom only |
| low | 1 | .25 | none | none |
| static | — | none | none | DOM poster |

These are budgets, not an automatically installed particle/shadow/post scene.
Read `QUALITY[tier]` when creating those resources. The governor samples active
work: two slow one-second windows downgrade, five stable seconds upgrade,
three direction reversals lock low. Coarse pointer and data-saver capabilities
cap quality; they do not replace measured evidence. DPR is not a performance
claim. Do not ship a permanent stats overlay or collect visitor telemetry.

Run `npm run test:runtime`, `npm run test:runtime:browser` (Chrome required),
template typecheck/build and the skill's browser matrix on the actual page.
Inspect rendered pixels, not merely shader compilation. Test reverse scroll,
resize, hover boundaries, keyboard focus, live reduced motion, no JS, no WebGL,
context loss/restoration and teardown. Emulation does not certify physical
Safari, battery use or a frame-rate guarantee.

Sources: [GSAP SplitText](https://gsap.com/docs/v3/Plugins/SplitText/),
[R3F performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance).
