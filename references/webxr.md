# WebXR + AR Quick-Look

> Tier D from `references/3d-stack.md`. XR is **opt-in, additive, and feature-gated**. The
> 2D page is complete without it; a user who never puts on a headset or taps "View in your
> space" loses nothing.
>
> **Detect before you offer.** Never render an Enter-XR button on a device that can't enter.
> A dead button is a broken promise — same severity as a 404'd asset.

Three entry paths, one rule each:

| Path | Surface | Detect | Enter |
|---|---|---|---|
| Immersive VR | headset (Quest, Vision Pro browser) | `isSessionSupported('immersive-vr')` | `VRButton` / `store.enterVR()` |
| Immersive AR | AR-capable phone / passthrough headset | `isSessionSupported('immersive-ar')` | `ARButton` / `store.enterAR()` |
| AR quick-look | iOS + Android phones (no WebXR needed) | `<model-viewer>` `canActivateAR` | `<model-viewer ar>` native button |

Quick-look is the pragmatic default for phones — it uses the OS-native AR viewer (ARKit
Quick Look on iOS, Scene Viewer on Android), needs no WebXR session, and "just works" on the
device the most people are holding. Immersive VR/AR is for actual headsets.

---

## 1. Feature detection (do this FIRST, every time)

`navigator.xr` may be absent (no WebXR), present-but-unsupported (no headset), or supported.
`isSessionSupported()` is async and can reject. Gate the button on the resolved boolean.

```js
async function xrSupport() {
  if (!('xr' in navigator) || !navigator.xr) return { vr: false, ar: false };
  const safe = (mode) =>
    navigator.xr.isSessionSupported(mode).catch(() => false); // can throw on some UAs
  const [vr, ar] = await Promise.all([
    safe('immersive-vr'),
    safe('immersive-ar'),
  ]);
  return { vr, ar };
}

// Only now decide what to show:
const { vr, ar } = await xrSupport();
if (vr) mountEnterVRButton();
else if (ar) mountEnterARButton();
// neither → show nothing XR-related; the 2D chapter stands on its own.
```

Rules:

- **No optimistic buttons.** Don't show "Enter VR" then alert "not supported" on click. If
  it can't enter, it isn't there.
- **HTTPS only.** WebXR requires a secure context. On `file://` and plain `http://`,
  `navigator.xr` is typically unavailable — the detection above degrades silently to the 2D
  page, which is correct. (model-viewer quick-look also needs HTTPS to launch AR.)
- **Under `prefers-reduced-motion`, do not surface immersive XR at all.** Quick-look (a
  static model the user inspects at their own pace) is acceptable; forced immersive motion
  is not. See `3d-stack.md` §4.

---

## 2. Immersive — vanilla Three (Mode A)

Three's addons ship `VRButton` and `ARButton` that create the session and wire
`renderer.xr`. The one structural change from a normal scene: **in XR you must use
`renderer.setAnimationLoop`, not your own `requestAnimationFrame`** — the headset compositor
drives the frame cadence (and per-eye timing), and a manual rAF will not run inside a
session.

```js
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

renderer.xr.enabled = true; // REQUIRED before adding either button

const { vr, ar } = await xrSupport();
if (vr) {
  document.body.appendChild(
    VRButton.createButton(renderer) // self-gates, but we already detected
  );
}
if (ar) {
  document.body.appendChild(
    ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'],          // ask only for what you use
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.getElementById('ar-overlay') },
    })
  );
}

// XR-safe loop: setAnimationLoop runs for BOTH normal and XR frames.
renderer.setAnimationLoop(() => {
  // outside a session this is your normal loop; inside one the compositor drives it
  if (!renderer.xr.isPresenting) {
    // apply scroll-camera (see 3d-stack.md §5) — only when NOT in a headset
  }
  renderer.render(scene, camera);
});
```

- **Scroll-camera and XR are mutually exclusive at runtime.** While `renderer.xr.isPresenting`
  is true, the *user's head* is the camera — do not also drive it from scroll. Freeze the
  scroll choreography on session start, restore on session end
  (`renderer.xr.addEventListener('sessionstart' | 'sessionend', …)`).
- **One renderer.** Don't spin up a second context for XR; the same clamped-DPR renderer
  (`3d-stack.md` §3) enters the session.

---

## 3. Immersive — R3F (`@react-three/xr` v6)

> v6 API. **Not** v5. The v6 shape is `createXRStore` + `<XR store={store}>` + `<XROrigin>`,
> and you enter via the store's `enterVR()` / `enterAR()`. If you see `<VRButton>` or a
> store-less `<XR>`, that's v5 and won't compile against `^6` (see `3d-stack.md` §2).

```tsx
'use client';
import { Canvas } from '@react-three/fiber';
import { createXRStore, XR, XROrigin } from '@react-three/xr';

const store = createXRStore(); // module scope: one store per experience

export default function ImmersiveChapter() {
  return (
    <>
      {/* HTML buttons live OUTSIDE the Canvas; gate them on detection (see §1) */}
      <div className="xr-controls">
        <button onClick={() => store.enterVR()}>Enter VR</button>
        <button onClick={() => store.enterAR()}>View in AR</button>
      </div>

      <Canvas dpr={[1, 2]} camera={{ position: [0, 1.6, 6], fov: 45 }}>
        <XR store={store}>
          <XROrigin position={[0, 0, 0]} /> {/* the user's reference space / floor */}
          {/* lights + scene… */}
        </XR>
      </Canvas>
    </>
  );
}
```

- **`<XROrigin>`** positions the player's reference space (where "the floor" and the user's
  feet are). Place the scene relative to it; do not teleport the user by moving the camera.
- **Gate the buttons** with the same `xrSupport()` detection (call it in an effect, store
  the result in state, render the button only when supported). `createXRStore` building the
  store is harmless; *showing the button* is what must be gated.
- `store.enterVR()` / `enterAR()` return promises — handle rejection (user dismissed the
  permission prompt) by leaving the 2D page running.
- R3F + drei `useScroll` (the scroll-camera from `3d-stack.md` §5) and immersive XR coexist
  in the same component: drive the camera from scroll when *not* presenting, and let `<XR>`
  own it when presenting (`useXR(s => s.session)` tells you which).

---

## 4. AR quick-look — `<model-viewer>` (phones, the pragmatic default)

For phones, skip WebXR entirely: `<model-viewer>` ships the model with a native "View in
your space" button that hands off to ARKit Quick Look (iOS) or Scene Viewer (Android). It
needs **a `.glb` for the WebGL/Android path and a `.usdz` for iOS** — iOS Quick Look does
not read glTF. Both come from the conversion pipeline in `ASSETS-3D.md`.

```html
<script type="module"
  src="https://unpkg.com/@google/model-viewer@3.4.0/dist/model-viewer.min.js"></script>

<model-viewer
  src="assets-3d/object/object.glb"     <!-- glTF: web preview + Android Scene Viewer -->
  ios-src="assets-3d/object/object.usdz" <!-- USDZ: iOS Quick Look (required for iOS AR) -->
  ar
  ar-modes="webxr scene-viewer quick-look"
  ar-scale="fixed"                       <!-- real-world meters; don't let the OS rescale -->
  camera-controls
  shadow-intensity="1"
  environment-image="neutral"
  poster="assets-3d/object/poster.webp"  <!-- the static fallback (3d-stack.md §4) -->
  reveal="auto"
  alt="Hero object, viewable in augmented reality">
  <button slot="ar-button" class="ar-cta">View in your space</button>
</model-viewer>
```

- **`ios-src` is not optional for iOS AR.** Without a USDZ, iPhones fall back to the
  in-page 3D view with no AR launch. The manifest carries `usdz` per chapter for exactly
  this (`ASSETS-3D.md`).
- **`ar-modes` order matters** — list `webxr` first (passthrough headsets), then
  `scene-viewer` (Android), then `quick-look` (iOS). model-viewer picks the first the
  device supports.
- **`ar-scale="fixed"`** keeps the object at real-world meters — the whole reason
  `ASSETS-3D.md` mandates metric units and a base-center pivot. `"auto"` lets users resize,
  which breaks "this is exactly how big it is."
- **`poster`** is the same static fallback the 3D chapter uses; model-viewer shows it before
  load and if WebGL is unavailable. No blank box, ever.
- **Detect AR before styling the CTA as available:** model-viewer exposes `canActivateAR`
  and fires a `'ar-status'` event. Hide or relabel the button when AR can't launch.

```js
const mv = document.querySelector('model-viewer');
mv.addEventListener('load', () => {
  if (!mv.canActivateAR) mv.querySelector('.ar-cta')?.setAttribute('hidden', '');
});
```

Quick-look pairs naturally with the **Object** and **Figure** chapters (a product you place
on your desk, a figure you stand next to). It is the lowest-friction "real 3D in the real
world" path and reaches the widest device set.

---

## 5. Comfort & safety (non-negotiable in immersive XR)

Immersive XR can make people physically sick and, with a headset on, they cannot see the
real room. These are safety rules, not preferences — treat them like the reduced-motion
mandate in `performance-budget.md`.

- **No forced locomotion.** Never move, fly, accelerate, or rotate the user's viewpoint
  *for* them. In a headset the camera is the head — driving it from scroll/time induces
  immediate nausea. The scroll-camera choreography is **paused** the instant a session
  starts (§2, §3). Movement, if any, is user-initiated (teleport, controller) and snap-turn,
  not smooth-turn.
- **Stable horizon.** Keep a fixed, level horizon / ground reference. No camera roll, no
  tilting the world, no horizon drift. The inner ear expects "down" to stay down.
- **Comfortable framerate or don't ship.** Below the headset's native refresh, XR is
  actively unpleasant and unsafe. If the scene can't hold framerate in a session, it must
  not offer one — fall back to the 2D chapter (this is why the poly budgets in `3d-stack.md`
  §3 are hard caps).
- **Input: controller + gaze, both.** Support pointing controllers *and* gaze/hand input —
  never make a control reachable by only one modality (Vision Pro is eyes+pinch; Quest is
  controllers or hands; some users have one controller). Targets are large and dwell-
  tolerant.
- **A reachable exit, always.** The user must be able to leave the session at any moment.
  The browser/headset system gesture exists, but also provide an in-experience exit
  affordance (a visible "Exit" target, or `store.getState().session?.end()` /
  `renderer.xr.getSession()?.end()` wired to a button). Never trap someone in XR.
- **Respect the boundary / guardian.** Stay within the user's configured play space; don't
  place required interaction targets where they'd have to step outside it. Don't draw
  full-field flashing or rapid high-contrast flicker (photosensitivity).
- **Comfortable defaults for placement.** Spawn content at a natural distance (objects
  ~0.5–2m, environments scaled so the user stands *in* them at the intended `XROrigin`),
  not in the user's face and not requiring them to walk to see anything.

If any comfort rule can't be met, **don't offer the immersive session** — ship quick-look
or the 2D chapter instead. A missing Enter-VR button is fine; a nauseating one is a defect.

---

## 6. Checklist (per XR-capable chapter)

- [ ] `xrSupport()` runs before any Enter-XR button is shown; unsupported → no button.
- [ ] HTTPS / secure context (WebXR + quick-look both require it).
- [ ] `renderer.xr.enabled = true` (vanilla) / `<XR store>` + `createXRStore` (R3F v6).
- [ ] `setAnimationLoop` used for the render loop (vanilla) — not manual rAF.
- [ ] Scroll-camera choreography **pauses** on `sessionstart`, resumes on `sessionend`.
- [ ] `.usdz` present for any chapter offering iOS AR quick-look (`ios-src`).
- [ ] `ar-scale="fixed"` + metric units → object appears at real-world size.
- [ ] `poster` set on `<model-viewer>`; static fallback present for the WebGL chapter.
- [ ] No forced locomotion; stable level horizon; no camera roll.
- [ ] Controller **and** gaze/hand input both supported; targets large.
- [ ] Visible in-experience exit affordance.
- [ ] `prefers-reduced-motion` → immersive session not offered (quick-look OK).
- [ ] WebGL context-loss handler in place (a lost context can drop a session — `3d-stack.md` §4).
```
