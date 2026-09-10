# Taste Guardrails

> The difference between slop and craft is anti-convergence.
> This skill refuses to produce generic parallax.

Use these craft references alongside the canonical `SKILL.md`. User direction, project brand contracts, accessibility, and lifecycle requirements take precedence over aesthetic suggestions. Timing, layer counts, and visual variation are starting points to test, not universal acceptance gates.

> **Mobile is a complete composition.** Use touch-safe motion when it helps the story and fits the brief. Natural flow and static imagery are valid choices. Reduced motion removes continuous and scroll-driven effects while preserving content and actions.

---

## 1. Banned Patterns

The following patterns are prohibited in all generated output. No exceptions, no "just this once."

### 1.1 Never animate `blur()`, `brightness()`, `contrast()`, or any CSS `filter` during scroll
**Why:** Filters force a full paint-composite cycle on every frame. On mid-tier mobile GPUs this drops you to 20-30fps instantly. The browser cannot cache filtered layers the same way it caches transform layers.
**Replacement:** Use crossfades between pre-blurred image assets, or fake depth with opacity + scale layering. If you need a rack-focus effect, crossfade two stacked image layers at different scales — never animate the filter itself.

### 1.2 Preserve native scrolling
Do not intercept wheel or touch input to force a sequence. Sticky or pinned staging
can coexist with native scrolling; use it only when holding the scene helps explain
the subject. Content height alone does not determine whether a pin is useful.

### 1.3 Release when the beat is complete
Long sequences of pins can obscure progress. Use natural-flow content between major
reveals where it helps orientation; do not add empty viewport spacers to meet a quota.
Test fast scrolling, anchors, and reaching the closing action.

### 1.4 Never apply parallax to text content below 18px
**Why:** Small text in motion destroys readability. The eye cannot track parallax-shifted microcopy. It becomes visual noise, not information.
**Replacement:** Keep body copy at `position: relative` with no scroll-driven transforms. Reserve parallax for display type (48px+), background layers, and decorative elements only.

### 1.5 Never call `setState` (React) inside a scroll handler — ever
**Why:** React state updates trigger re-renders. At 60fps, you are asking React to re-render your component tree 60 times per second. On a complex page, this creates jank that no amount of memoization will fix.
**Replacement:** Use refs and direct DOM manipulation for scroll-driven values. GSAP's `quickTo`, Framer Motion's `useTransform`, or raw `ref.current.style.transform` assignments. Keep React for structural updates only — never for per-frame values.

### 1.6 Never animate `width`, `height`, `top`, `left`, `margin`, or `padding`
**Why:** These properties trigger layout recalculation (the "layout thrash"). The browser must recompute the position of every affected element, then paint, then composite. This is a 3-4ms penalty per frame on desktop, 10-15ms on mobile. At 60fps you have 16.67ms total.
**Replacement:** Use `transform: scale()` for size changes, `transform: translate()` for position changes. If you need content to reflow, toggle a CSS class and let a `transition` handle it — never drive it from a scroll scrubber.

### 1.7 Budget actual layer cost
Use only layers that carry distinct information. Layer count alone does not predict
GPU memory: dimensions, pixel ratio, textures, and render targets matter. Measure
substantial scenes and simplify when the target device cannot sustain them.

### 1.8 Never attach a scroll listener without rAF throttling or a scrub proxy
**Why:** Raw `scroll` events fire at irregular intervals and can fire multiple times per frame. Reading `scrollY` and updating the DOM synchronously creates inconsistent motion and missed frames.
**Replacement:** Use Lenis (`requestAnimationFrame`-based smooth scroll), GSAP ScrollTrigger (which internally uses rAF), or a hand-rolled rAF loop that reads scroll position once per frame. Never update layout from inside a raw `addEventListener('scroll')` callback.

### 1.9 Gate pointer tilt and respect motion preferences
Pointer tilt requires hover and a fine pointer. Narrow/coarse-pointer layouts use a
complete flow composition with optional modest motion. Reduced motion disables
parallax, pinning, smoothing, autoplay, and continuous loops. A user-requested static
page is also valid. See `references/mobile-motion.md` and the canonical `SKILL.md`.

### 1.10 Never auto-play scroll-driven motion without user interaction
**Why:** Auto-scrolling or auto-playing pinned sections (via `setInterval`, `ScrollTrigger.to`, or similar) violates user agency. It also breaks screen readers and keyboard navigation.
**Replacement:** All motion must be scroll-driven or user-triggered. If you want a "playthrough" experience, provide a prominent "Play intro" button that calls `gsap.to(window, { scrollTo: ... })` — once, on user request.

### 1.11 Choose easing by purpose
Direct scroll scrubbing uses linear progress. Time-based entrances and controls may
use different curves when their roles warrant it; related motions can share a curve.
Avoid stacking smoothing systems that make the scene trail the visitor's input.

### 1.12 Never ship dead code — orphaned CSS selectors or unreachable JS branches
**Why:** Dead rules and dead branches are dishonest bloat: a `.fig`/`.selector` class no element uses, or an `if (el.hasAttribute('data-tilt'))` branch when nothing carries `data-tilt`, reads as a feature but does nothing — misleading the next reader and inflating the file. (A real QA audit found exactly this shipping in a page.)
**Replacement:** Every CSS selector must match a real element; every attribute-branch must have an element that sets the attribute. If a feature isn't wired, wire it or delete it. `cinematic-doctor`'s advisory **hygiene** pass flags dead classes and dead attribute-branches — drive it to zero.

### 1.13 A single-file Mode A build must be self-contained and `file://`-safe
**Why:** Mode A's promise is "open the `.html` from disk and it just works." That breaks the moment the page loads an **external** local file — a sibling `<script src="./app.js">` or a JS-fetched image/texture — because the browser's `file://` cross-origin policy blocks it, so the page silently fails off a double-click. (Audit finding: `flagship`/`studio` split JS out; the 3D fly-throughs load textures via JS — all actually need a server.)
**Replacement:** For a true single-file Mode A build, **inline** the JS and avoid JS-loaded local assets (use CSS placeholders / data-URIs, or load over a CDN). If a build genuinely needs external modules or texture files, it is a **served** page — say so explicitly ("run `python3 -m http.server`") and don't market it as double-click-runnable. `cinematic-doctor`'s hygiene pass flags external local `<script src>`.

---

## 2. Cinematic Vocabulary

Web scroll is not "web design." It is **digital cinematography**. Every scroll behavior maps to a film grammar. Use the right term, implement the right motion, and the site will feel cinematic instead of gimmicky.

| Film Term | Scroll Equivalent | CSS/GSAP Implementation | Use When |
|-----------|------------------|------------------------|----------|
| **Dolly zoom** (Vertigo effect) | Background scales while foreground stays fixed | `scale(1 → 1.3)` on background layer + `translateZ(0 → -200px)`; foreground `scale` counter-animates to maintain size | Hero reveal, dramatic entrance, conveying disorientation or revelation |
| **Whip pan** | Fast horizontal snap between chapters | `translateX(-100vw → 0)` with `power4.inOut` easing, 0.4s duration; content blurs via motion, not filter | Chapter transition, genre shifts, tonal whiplash |
| **Rack focus** | Shifting attention between depth planes | Crossfade between two stacked layers at different scales — NOT CSS `filter: blur()`. Top layer fades out as bottom layer fades in, with 10-15% overlap | Shifting subject focus, narrative handoffs, revealing hidden detail |
| **Tracking shot** | Parallax at medium depth, steady camera | `translateY` at 0.5x scroll rate on mid-layer; foreground and background at 0.2x and 0.8x respectively | Narrative scroll, storytelling sequences, guided attention |
| **Crane shot** | Vertical dolly + subtle rotation | `translateY` + `rotateX(±4deg)` driven by scroll progress; perspective origin at `50% 100%` | Opening sequence, establishing shot, conveying scale and grandeur |
| **Static two-shot** | Split viewport, both subjects visible, no motion | Two 50vw columns, both `position: sticky`, zero parallax; tension comes from contrast, not movement | Comparisons, debates, dual narratives, before/after |
| **Match cut** | Identical composition, content swap | Same layout, same element positions; content crossfades with `opacity` while layout holds perfectly still | Category switches, product variants, timeline jumps |
| **Push-in** | Slow zoom toward a subject | `scale(1 → 1.08)` over 200vh of scroll, combined with `translateY` to keep subject centered; minimal other motion | Intensifying focus, emotional escalation, "the moment before" |
| **Montage** | Rapid cuts, stacked cards, snap scroll | Multiple pinned sections at 80vh each, snap scroll between them (`snap: 1 / (sections - 1)`), 0.15s transitions | Showcasing variety, process steps, portfolio grids |
| **Long take** | Single continuous pinned section with layered reveals | One 300vh pin; elements reveal sequentially via staggered `opacity` + `translateY` tied to scroll progress; no snapping, no hard cuts | Immersive narrative, world-building, letting the user explore at their own pace |
| **Overhead / God shot** | Scale-down from full frame to reveal surrounding context | `scale(1.5 → 1)` + `translateY(20% → 0)` over pin duration; starts tight on detail, pulls back to show full layout | Revealing structure, "where are we" moments, architectural showcases |
| **Jump scare** (comedic) | Sudden scale snap + rotation | `scale(0.8 → 1.05)` with `back.out(2)` + `rotateZ(-2deg → 0deg)` triggered at scroll threshold; 0.3s duration | Playful reveals, Easter eggs, Gen-Z energy moments |

---

## 3. Pacing decisions

Scroll distance does not prescribe reading time: visitors control their own speed.
Choose pin distance from the transformations and readable holds the content needs.
There is no universal minimum pin length, chapter count, or release-space quota.

For each beat, compose start → transformation → readable hold → exit. A useful
first experiment assigns 0–20% to establishing the scene, 20–55% to transformation,
55–80% to the hold, and the remainder to release. Adjust after inspecting midpoints,
fast and slow scroll, reverse scroll, and narrow-screen reading order.

Keep body copy stable. Group staggered elements by meaning; avoid delaying the last
word until the visitor has already left. Prefer native free flow between major
reveals. Snap is optional; if used, check interruption, keyboard navigation, anchors,
and pin boundaries. Remove overlapping effects when they compete for attention.

---

## 4. Anti-Convergence Principles

These rules exist to prevent the output from looking like every other scroll-driven website on Awwwards. Convergence is the enemy. Generic parallax, default easings, and center-aligned everything are symptoms of the same disease: lack of intention.

### 4.1 Match easing to the clock
Use linear progress (`ease: "none"` in GSAP) for directly scrubbed position changes. For time-based entrances and interactions, choose easing to fit the brand. These curves are options, not required defaults:
- **Hero entrances:** `cubic-bezier(0.16, 1, 0.3, 1)` (dramatic deceleration — the "reveal" feel)
- **Chapter exits:** `cubic-bezier(0.7, 0, 0.84, 0)` (clean acceleration — the "handoff" feel)
- **Micro-interactions:** `cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot — the "playful" feel)
- **Transitions:** `cubic-bezier(0.87, 0, 0.13, 1)` (heavy, deliberate — the "chapter cut" feel)

### 4.2 Never center-align all text
Centered text is the first sign of a template. Use intentional asymmetry: left-align body copy, center only display titles (and not all of them), and occasionally right-align pull quotes or metadata. Asymmetry creates visual tension. Tension creates interest.

### 4.3 Keep depth coherent
Choose depth relationships that explain the scene. Reuse them for related content;
change them when the viewpoint or subject changes. Do not vary numbers merely to
make adjacent chapters different.

### 4.4 Give transitions a narrative purpose
Repeat a transition when it establishes continuity. Change it when the story makes
a meaningful turn. A sequence of unrelated effects can weaken an otherwise clear arc.

### 4.5 Treat titles as a system
A consistent mask reveal, word stagger, or split-line rise can establish identity.
Reserve a different treatment for a meaningful emphasis. Keep semantic text readable
without splitting or animation, and avoid layout-heavy text scrubbing on hot paths.

### 4.6 Preserve the brand palette
A single temperature can sustain an entire story. Shift atmosphere only within the
user's palette and required axes; do not force warm/cool alternation or add colors
to manufacture variety.

### 4.7 Depth layers must earn their place
Every parallax layer must carry distinct visual information. If two layers are visually similar enough that removing one does not change the experience, merge them. Empty parallax is decoration masquerading as design.

### 4.8 Typography must breathe
Minimum `line-height: 1.1` for display type, `1.5` for body. Maximum 2 typefaces per chapter (one display, one body). If you need a third, use a weight or style variation of an existing family. More than 2 fonts in one viewport is visual cacophony.

---

## 5. 3D / WebGL / XR banned patterns

These apply when a build uses real 3D (Three.js / WebGL / `<model-viewer>` / WebXR — Tier B/C/D from `SKILL.md` Phase 3). 3D is the most expensive thing on a scroll page; a careless 3D chapter is worse than no 3D chapter. The authority for the correct patterns is `references/3d-stack.md` and `references/webxr.md`; the worked reference is `examples/flagship/`.

### 5.1 Never leave `devicePixelRatio` uncapped
**Why:** On a 3x retina phone an uncapped renderer rasterizes ~9× the pixels of a logical viewport — a "retina tax" that melts mid-tier GPUs, drains battery, and tanks the frame rate to a slideshow. It is the single most common WebGL performance failure.
**Replacement:** Clamp `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` — and go lower on mobile (1.5 or even 1). One renderer per page; never spin up a second WebGL context per chapter.

### 5.2 Never ship a 3D chapter with no non-WebGL fallback
**Why:** WebGL can be unavailable (old device, disabled flag, blocklisted driver) or the context can be lost at runtime. With no fallback the user gets a blank canvas — a dead, broken-looking chapter.
**Replacement:** Feature-detect WebGL before creating a context and provide a permanent poster / CSS fallback (a still image, a CSS gradient scene). Add a `webglcontextlost` handler that calls `e.preventDefault()` plus a `webglcontextrestored` handler that rebuilds the scene. The fallback is a first-class deliverable, not an afterthought.

### 5.3 Never run continuous GPU animation without a `prefers-reduced-motion` path
**Why:** A 3D scene that auto-rotates, drifts, or loops a shader ignores a user who has explicitly asked the OS for less motion. For vestibular-sensitive users this is not a preference — it is a health setting, and it also needlessly drains battery.
**Replacement:** When `prefers-reduced-motion: reduce` is active, render a single static frame and stop — no rAF loop, no idle animation, no auto-orbit. Draw once, then halt.

### 5.4 Never raycast or do heavy work every frame on scroll
**Why:** Raycasting against scene geometry, recomputing bounding volumes, or rebuilding data structures inside the per-frame loop blows the 16.67ms budget and produces scroll jank exactly when the user is moving.
**Replacement:** Throttle raycasts to pointer events (not every frame), cache results, and precompute anything stable. Gate the rAF loop on document visibility AND an `IntersectionObserver` so it does no work while the canvas is off-screen.

### 5.5 Never ship giant uncompressed textures or un-Draco'd meshes
**Why:** A 4K uncompressed texture is tens of megabytes of VRAM and a slow decode; an un-compressed glTF mesh balloons both download and parse time. Both stall first paint and pressure GPU memory until layers fall back to CPU rasterization.
**Replacement:** Cap textures at 2K unless there is a named reason to go higher, use compressed formats (KTX2 / Basis) where supported, and compress geometry with Draco / meshopt. Budget and pipeline live in `ASSETS-3D.md` and `references/3d-stack.md`.

### 5.6 Never force VR locomotion or move the user without consent
**Why:** Moving the camera (the user's head) in VR while they stand still is the classic trigger for simulator sickness. Forced acceleration, smooth strafing, or camera shake in an immersive session can make people physically ill.
**Replacement:** Default to teleport / snap-turn comfort locomotion, keep a stable horizon, and never translate the user without an explicit input. The 2D page must be complete without XR; XR is a session the user chooses to enter. See `references/webxr.md` for comfort and safety rules.

### 5.7 Never bake readable UI text into 3D or generated imagery
**Why:** Text baked into a mesh texture or an AI-generated image is unselectable, inaccessible to screen readers, blurs at distance/angle, cannot be localized, and is impossible to edit. It is the 3D version of putting your nav inside a JPEG.
**Replacement:** Render titles, labels, captions, and HUD as HTML/CSS overlaid on the canvas (or as a CSS3D / DOM layer), so it stays selectable, crisp, accessible, and editable.

### 5.8 Never skip `dispose()` on chapter teardown
**Why:** Three.js does not garbage-collect GPU resources for you. Geometries, materials, textures, and render targets left undisposed leak VRAM on every chapter swap until the tab crashes or the browser drops layers back to CPU rasterization.
**Replacement:** On teardown, explicitly `dispose()` every geometry, material, and texture (and the renderer / render targets), remove event listeners, and cancel the rAF handle. Treat teardown as a required counterpart to setup.

### 5.9 Never hardcode 3D asset paths in code
**Why:** Model, USDZ, and poster paths scattered through component code are impossible to audit, swap, or validate, and they silently rot when assets move — the failure mode is a blank chapter discovered in production.
**Replacement:** Drive every runtime 3D asset path from a manifest (the `examples/flagship/assets-3d/manifest.json` shape: `version`, `basePath`, `chapters.{id}.{model, usdz, poster, scale, cameraNodes, clips, ar}`). Code reads paths from the manifest; it never inlines them.

---

## 6. Enforcement

Use the canonical `SKILL.md` verification workflow. Check readability, brand fit,
responsive/static compositions, property ownership, lifecycle cleanup, and the
actual browser experience. Record relevant timing decisions in existing project
notes; a separate manifest is only needed when the implementation uses one.

Do not fail a page for repeating a coherent title treatment, using linear scrubbing,
or omitting decorative motion. Do not pass a page solely because it matches these
suggestions or earns a static heuristic score.

## Learned additions

<!-- pointers are appended here by learn mode; full recipes live in references/learned/ -->
