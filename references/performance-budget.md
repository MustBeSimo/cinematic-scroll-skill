# Performance Budget

> Target 60fps. Only animate `transform` and `opacity`. Use `will-change` strategically, never globally.
> Deviation from any constraint in this document requires written justification and explicit sign-off.

---

## 1. The 60fps Contract

### Frame Budget

| Metric | Constraint | Rationale |
|--------|-----------|-----------|
| Frame duration | 16.67ms max | 60fps = 1000ms / 60 frames |
| JavaScript execution | 10ms max per frame | Leaves 6.67ms for browser compositing + overhead |
| Scroll handler execution | 2ms max | Excess causes input lag |
| RAF callback duration | 1.5ms max | Velocity tracking, progress updates |
| Layout read batch window | 100ms | Batch all reads, never interleave read/write |

### Permitted Properties

These are the **ONLY** properties that may be animated during scroll-driven interactions:

```
translate3d(x, y, z)    — preferred over translateX/Y (forces compositing)
scale(x, y)            — independent axis scaling allowed
rotateX/Y/Z(deg)       — 3D rotation requires perspective on parent
opacity                — 0 to 1 only (no partial opacity for text)
```

### Forbidden Properties

Never animate these during scroll. No exceptions.

```
width, height          — triggers layout recalculation
top, left, right, bottom — triggers layout
margin, padding        — triggers layout on parent + siblings
font-size, line-height  — triggers text reflow
border-radius          — triggers layout recalculation
box-shadow             — causes repaint on every frame
filter: blur()         — GPU killer; dramatically more expensive than opacity
filter: brightness()   — forces main-thread compositing
filter: contrast()     — forces main-thread compositing
clip-path (animated)   — main-thread cost; can blow the frame budget
```

### Scroll Handler Rules

1. **No layout reads in scroll handlers.** `getBoundingClientRect`, `offsetHeight`, `clientWidth`, and `scrollHeight` are forbidden inside `onScroll`, ScrollTrigger callbacks, and IntersectionObserver handlers. Cache values on resize. Use `ResizeObserver` for element dimension changes.

2. **No forced synchronous layout.** Do not write a style then read a layout property in the same frame. Batch all writes after all reads.

3. **Debounce resize handlers.** Wait 150ms after final resize event before recalculating layout-dependent values.

4. **Use `passive: true` on all scroll listeners.** Required for scroll-linked effects. Mandatory. No exceptions.

---

## 2. will-change Strategy

### Rules

| Rule | Constraint | Violation Cost |
|------|-----------|----------------|
| Apply timing | 200ms BEFORE animation starts | Late = missed frames at animation start |
| Remove timing | 200ms AFTER animation ends | Early = frames dropped at end |
| Max simultaneous elements | 3 | Each promoted layer consumes 4-8MB GPU memory |
| Never apply globally | `* { will-change: transform }` is forbidden | Promotes every element to its own layer; GPU memory exhaustion |
| Never apply to text-only elements | No will-change on `<p>`, `<span>`, `<h1>` | Text layers are expensive; subpixel rendering breaks |
| Never apply permanently | Remove after animation completes | Each layer increases compositor tree traversal time |

### Implementation

```javascript
// Correct: toggle will-change around animation lifecycle
const element = document.querySelector('.parallax-layer');

// Promote the layer first, THEN start the animation ~200ms later — this
// gives the compositor time to create the layer before motion begins.
element.style.willChange = 'transform';
setTimeout(() => startAnimation(), 200);

// 200ms after animation completes, release the layer
animation.onComplete = () => {
  setTimeout(() => element.style.willChange = 'auto', 200);
};
```

### Layer Count Budget

```
Desktop (1920x1080, dedicated GPU):  max 10 compositor layers per viewport
Tablet (768x1024, integrated GPU):   max 6 compositor layers
Mobile (375x812, mobile GPU):        max 4 compositor layers
Low-end (budget Android):            max 2 compositor layers
```

### Layer Count Calculation

Each of the following counts as one compositor layer:
- Any element with `will-change: transform` or `will-change: opacity`
- Any element with `transform: translateZ(0)` or `translate3d()`
- Any element with `position: fixed`
- Any element with `opacity < 1`
- Any element with a 3D transform (even if no will-change)
- Any `<video>` element (always its own layer)
- Any element with `filter` applied
- The root layer (always counts as 1)

**Example:** A pinned hero with 5 parallax layers + 1 fixed title + 1 video background = 8 layers. Exceeds mobile budget of 4. Must degrade.

---

## 3. Mobile Degradation Matrix

> **Mobile is not a dead page.** The goal of this skill is cinematic motion on
> *every* device. Mobile tiers degrade *how* motion runs — never *whether* it
> runs. Flagship and mid-range phones get genuine scroll-coupled motion (image
> parallax that moves *while* scrolling + scroll-linked entrance reveals),
> implemented compositor-only and touch-safe. What mobile drops is the
> *expensive* stuff: 3D tilt (motion sickness on touch — see Section 1.9 of
> `taste-guardrails.md`), filter animations, pinning/scroll-jacking, and excess
> layers. See `references/mobile-motion.md` for the recipe.

### Tier 1: Flagship (iPhone 15 Pro, Pixel 8 Pro, Samsung S24)

| Capability | Status |
|-----------|--------|
| Full parallax depth layers | All layers active (within the 4-layer mobile cap) |
| Scroll-coupled image parallax | Enabled — lerped/damped, transform-only, JS-driven (NOT CSS `animation-timeline`) |
| Scroll-linked entrance reveals | Enabled — transform + opacity (IntersectionObserver one-shot or framer `whileInView`) |
| 3D transforms (tilt) | **Disabled on touch** — motion sickness risk; never `rotateX/Y` tilt on touch |
| Filter animations | Disabled entirely (GPU killer on mobile) |
| Pinning / scroll-jacking | Disabled on touch — chapters stack, motion stays scroll-coupled |
| Video backgrounds | Allowed |
| Particle effects | Max 200 particles |
| Target frame rate | 60fps |
| Minimum acceptable | 55fps |

### Tier 2: Mid-range (iPhone 12, Pixel 6, Samsung S21)

| Capability | Status |
|-----------|--------|
| Depth layers | Reduce to 70% of desktop count (round down), within the 4-layer mobile cap |
| Scroll-coupled image parallax | Enabled — one transform-only mover per section, lerped, JS-driven |
| Scroll-linked entrance reveals | Enabled — transform + opacity, staggered |
| 3D transforms (tilt) | **Disabled on touch** — motion sickness risk |
| Filter animations | Disabled entirely |
| Pinning / scroll-jacking | Disabled on touch — stacked layout, motion stays scroll-coupled |
| Video backgrounds | Poster image only, no autoplay |
| Particle effects | Max 50 particles |
| Target frame rate | 55fps |
| Minimum acceptable | 45fps |

### Tier 3: Budget (iPhone SE 2020, Pixel 4a, budget Android)

| Capability | Status |
|-----------|--------|
| Depth layers | Max 2 layers (background + foreground) |
| 3D transforms | Disabled; fall back to 2D transforms |
| Scroll-coupled parallax | Minimal — disable parallax movers; static backgrounds OK |
| Scroll-linked entrance reveals | Enabled — opacity + small `translateY` only (one-shot) |
| Animations | Entrance reveals + opacity transitions only |
| Particle effects | Disabled |
| Target frame rate | 30fps |
| Minimum acceptable | 24fps |

### Tier 4: Reduced Motion (prefers-reduced-motion: reduce)

| Capability | Status |
|-----------|--------|
| All scroll-driven animation | Disabled or instant |
| Parallax | Disabled |
| Pinned sections | Convert to static flow layout |
| Transitions | Instant (0ms duration) |
| Content accessibility | All content visible without animation |
| Auto-playing elements | Disabled |
| Respect method | CSS media query + JS detection (both required) |

```css
/* Mandatory reduced-motion support */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```javascript
// JS detection (required in addition to CSS)
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  // Disable GSAP ScrollTrigger pinning
  // Disable parallax
  // Show all content immediately
}
```

### Mobile scroll-coupled motion

Cinematic on mobile means motion that is *coupled to the scroll* — things move
**while** the finger drags — done touch-safe and smooth. Rules:

- **CSS scroll-timelines: version-aware, JS as the safe default.** Native CSS
  scroll-driven animations (`animation-timeline: scroll()/view()`) are now
  Baseline on **Safari 26+, Chrome/Edge 115+, Opera** (Firefox behind a flag).
  But **older iOS Safari (≤18)** reports `CSS.supports('animation-timeline: view()')`
  as `true` while the timeline **does not actually drive** — animations sit frozen
  at their start frame. So: feature-detect *and* version-gate. Where you must
  support older iOS, drive scroll-coupled motion from JS — a `requestAnimationFrame`
  loop reading `scrollY` (Mode A) or framer-motion `useScroll`/`useSpring` (Mode B);
  this remains the safest cross-version default. Use the CSS path as a progressive
  enhancement behind `@supports (animation-timeline: scroll())`, never as the only
  path on mobile.
- **`content-visibility: auto`** on offscreen chapters (with
  `contain-intrinsic-size` to reserve layout) — Baseline since 2025-09; skips
  rendering work for chapters not near the viewport, a large initial-render win on
  long pinned pages. Do **not** apply it to above-the-fold/LCP content (it can
  delay first paint of what's already visible).
- **Cache offsets — no per-frame layout reads.** Read each mover's position
  once on init and on resize. Never call `getBoundingClientRect` inside the
  rAF loop or scroll handler (see Section 1, Scroll Handler Rules).
- **Lerp for smoothness.** Ease the applied value toward the scroll-derived
  target each frame (`cur += (target - cur) * 0.12`) so motion stays buttery
  during flick-scroll and momentum, instead of snapping frame-to-frame.
- **rAF only while scrolling.** Start the loop on scroll, stop it once the
  value has settled (within an epsilon of target). Don't burn a permanent rAF.
- **Compositor-only.** `transform` (`translate3d`) + `opacity` exclusively.
  No filters, no layout properties, no 3D tilt on touch.

Recipe with code sketches (vanilla + framer): `references/mobile-motion.md`.

### Tier Detection

```javascript
function getPerformanceTier() {
  // Check reduced motion first (takes precedence)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'reduced';
  }

  // NOTE: deviceMemory is a coarse heuristic — caps at 8, unsupported in Safari/Firefox.
  // Treat as a hint, not ground truth; fall back to cores + UA.
  const memory = navigator.deviceMemory; // GB (Chromium only)
  const cores = navigator.hardwareConcurrency;
  const isMobile = /iPhone|iPad|iPod|Android/.test(navigator.userAgent);

  if (!isMobile) return 'desktop';
  if (memory >= 8 && cores >= 6) return 'flagship';
  if (memory >= 4 && cores >= 4) return 'mid-range';
  return 'budget';
}
```

---

## 4. Benchmark Targets

### Core Web Vitals

| Metric | Target | Maximum Acceptable | Measurement Tool |
|--------|--------|-------------------|------------------|
| First Contentful Paint (FCP) | < 1.0s | 1.5s | Lighthouse |
| Largest Contentful Paint (LCP) | < 1.8s | 2.5s | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.05 | 0.1 | Lighthouse |
| Total Blocking Time (TBT) | < 100ms | 200ms | Lighthouse |
| Time to Interactive (TTI) | < 2.5s | 3.8s | Lighthouse |
| Lighthouse Performance | > 95 | 90 | Lighthouse |

### Scroll-Specific Metrics

| Metric | Target | Maximum Acceptable | Measurement Method |
|--------|--------|-------------------|-------------------|
| Scroll jank (% frames dropped) | < 2% | 5% | Chrome DevTools Performance panel |
| Scroll latency (input to paint) | < 8ms | 16ms | DevTools input timeline |
| Layer promotion time | < 30ms | 50ms | DevTools Layers panel |
| Compositor thread budget | < 4ms/frame | 6.67ms | DevTools Performance |
| Main thread idle during scroll | > 60% | 40% | DevTools Performance |

### Scroll Jank Measurement Protocol

1. Open Chrome DevTools > Performance panel
2. Click Record
3. Scroll the page at moderate speed for 10 seconds
4. Stop recording
5. Count frames exceeding 16.67ms (red bars in timeline)
6. Formula: `(dropped_frames / total_frames) * 100`
7. Result must be < 5% to ship

### Device Testing Matrix

Test on ALL of the following before shipping:

| Device | OS | Browser | Test Focus |
|--------|-----|---------|-----------|
| iPhone 15 Pro | iOS 17 | Safari | Flagship baseline |
| iPhone 12 | iOS 17 | Safari | Mid-range tier |
| iPhone SE 2022 | iOS 17 | Safari | Budget tier |
| Samsung S24 | Android 14 | Chrome | Flagship Android |
| Pixel 6 | Android 14 | Chrome | Mid-range Android |
| Budget Android (Moto G) | Android 13 | Chrome | Budget tier |
| MacBook Pro M3 | macOS 14 | Chrome | Desktop reference |
| Windows laptop (i5) | Windows 11 | Chrome | Desktop mid-range |

---

## 5. Image & Asset Budget

### Per Chapter / Section

| Metric | Desktop | Mobile | Enforcement |
|--------|---------|--------|-------------|
| Max images per chapter | 3 | 2 | Hard limit |
| Max image weight (total) | 500KB | 200KB | Hard limit |
| Max image dimensions | 1920px wide | 828px wide | Hard limit |
| Preferred format | AVIF | AVIF | Best compression; serve first via `<picture>` |
| Fallback format | WebP | WebP | Required baseline for browsers without AVIF |
| Legacy fallback | JPEG | JPEG | Final `<img>` src for very old browsers |

### Image Loading Strategy

```
Above the fold (first viewport):
  - eager loading
  - preload critical hero image in <head>
  - max 2 images

Below the fold:
  - loading="lazy" on all images
  - IntersectionObserver rootMargin: "200px" (start load 200px before visible)
  - decode="async" for non-critical images

During scroll animations:
  - No network requests may fire
  - All animation assets must be loaded before animation starts
```

### Image Preloading

```html
<!-- Preload first viewport image only -->
<link rel="preload" as="image" href="hero.webp" type="image/webp">
```

Preload **maximum 2 images** per page. Additional preloads consume bandwidth and delay first render.

### Font Budget

| Metric | Limit | Rationale |
|--------|-------|-----------|
| Max font families | 2 | Each family = additional blocking request |
| Max weights per family | 4 | Common: 400, 500, 700, 400i |
| Font-display | swap | Mandatory. No exceptions. |
| Preload fonts | 1 | Only the first viewport's primary font |
| Font format | woff2 | With woff fallback for older browsers |
| Total font weight | < 200KB | All weights combined |

```css
/* Mandatory font-display: swap */
@font-face {
  font-family: 'Primary';
  src: url('primary.woff2') format('woff2'),
       url('primary.woff') format('woff');
  font-weight: 400 700;
  font-display: swap; /* Text visible immediately in fallback font */
}
```

### CSS Budget

| Metric | Limit |
|--------|-------|
| Critical CSS | < 20KB (inline in `<head>`) |
| Total CSS | < 100KB gzipped |
| Unused CSS | < 30% (measured via Coverage tab) |
| CSS animations | Prefer CSS keyframes over JS for simple effects |

### JavaScript Budget

| Metric | Limit |
|--------|-------|
| Critical JS (blocking) | 0KB — all JS must be async or deferred |
| GSAP core | ~25KB gzipped (allowed) |
| ScrollTrigger plugin | ~8KB gzipped (allowed) |
| Animation-related JS total | < 100KB gzipped |
| Third-party scripts | Avoid during scroll animations |

---

## 6. Monitoring Checklist

### Pre-Launch Checklist

Before shipping any scroll experience, ALL items must be checked:

- [ ] Chrome DevTools Performance: record 10s scroll, verify < 5% red frames
- [ ] Lighthouse: Performance score > 90
- [ ] WebPageTest: Filmstrip shows smooth visual progression during scroll
- [ ] iPhone 12 (Safari): no visible stutter during fast scroll (flick gesture)
- [ ] iPhone SE: content is accessible, no broken layout on budget tier
- [ ] Reduced-motion test: all content visible, no broken layout with `prefers-reduced-motion: reduce`
- [ ] Battery test: 5 minutes of continuous scrolling drains < 3% battery
- [ ] Memory test: tab memory does not grow > 50MB after 5 minutes of scrolling
- [ ] Layer count: DevTools Layers panel shows < 10 layers on desktop, < 4 on mobile
- [ ] No layout thrashing: DevTools Performance shows no purple "Layout" bars during scroll
- [ ] Network: no images load during scroll animation (all preloaded)

### CI Integration

```javascript
// lighthouse-ci.config.js
module.exports = {
  ci: {
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.90 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
      },
    },
  },
};
```

### Regression Thresholds

| Scenario | Action |
|----------|--------|
| Lighthouse score drops below 90 | Block merge |
| Scroll jank exceeds 5% | Block merge |
| LCP exceeds 2.5s | Block merge |
| Layer count exceeds budget | Block merge |
| Bundle size exceeds 100KB | Flag for review (not blocking) |

---

## 7. GSAP-Specific Rules

### ScrollTrigger Configuration

```javascript
// Mandatory defaults for all ScrollTrigger instances
ScrollTrigger.defaults({
  markers: false,          // Never ship with markers enabled
  scrub: 0.5,              // 0.5s smoothing lag (smooth but responsive)
  invalidateOnRefresh: true, // Recalculate on resize
  fastScrollEnd: true,     // Prevent animation catch-up on fast scroll
  preventOverlaps: true,   // Prevent tween conflicts
});
```

### Performance Rules

| Rule | Constraint |
|------|-----------|
| Max concurrent ScrollTriggers | 50 per page |
| Scrub smoothing | 0.3-0.8 range. Never 0 (choppy) or > 1 (sluggish). |
| Pin spacing | Use `pinSpacing: true` (default). Prevents layout collapse. |
| Batch tweens | Use `gsap.timeline()` for sequences, not individual tweens. |
| Kill on unmount | Call `ScrollTrigger.kill()` on all instances when section removed. |
| No layout reads in onUpdate | Cache values. No `getBoundingClientRect`. |

### Forbidden GSAP Patterns

```javascript
// WRONG: Individual tweens for each element
elements.forEach(el => {
  gsap.to(el, { y: 100, scrollTrigger: { trigger: el } });
});

// RIGHT: Single timeline with scrub
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '.container',
    scrub: 0.5,
  }
});
tl.to('.el1', { y: 100 })
  .to('.el2', { y: 200 }, '<');

// WRONG: Reading layout in onUpdate
scrollTrigger: {
  onUpdate: () => {
    const rect = el.getBoundingClientRect(); // FORBIDDEN
  }
}

// RIGHT: Cached values
const cachedY = el.offsetTop; // Read once on init
scrollTrigger: {
  onUpdate: (self) => {
    const y = cachedY * self.progress; // Use cached value
  }
}
```

---

## 8. Failure Modes

### What Happens When Constraints Are Violated

| Constraint Violated | Symptom | User Impact |
|-------------------|---------|-------------|
| > 10 compositor layers | GPU memory exhaustion, tab crash | Page goes blank, browser kills tab |
| Layout animation during scroll | Purple bars in DevTools | Janky, stuttering scroll |
| Filter animation during scroll | Main-thread compositing | 15-30fps, unusable |
| No `passive: true` on scroll | Blocked touch events | Scroll doesn't respond to touch |
| will-change on > 3 elements | Excessive GPU memory | Tab crashes on mobile |
| Images loading during scroll | Network waterfall in Performance | Scroll pauses while images decode |
| > 2ms scroll handler | Input latency | Scroll feels "disconnected" from finger |
| No reduced-motion support | Motion sickness, inaccessible content | Legal/compliance risk |

### Emergency Degradation

If runtime frame rate drops below target tier's minimum for > 3 seconds:

1. Disable all parallax immediately
2. Reduce to opacity-only transitions
3. Unpin all pinned sections
4. Log degradation event to analytics
5. Do not re-enable effects without page reload

```javascript
let consecutiveSlowFrames = 0;

function checkFrameRate(timestamp) {
  if (lastTimestamp) {
    const delta = timestamp - lastTimestamp;
    if (delta > 33.33) { // Below 30fps
      consecutiveSlowFrames++;
      if (consecutiveSlowFrames > 3 * 60) { // 3 seconds at 60fps sample
        emergencyDegrade();
      }
    } else {
      consecutiveSlowFrames = 0;
    }
  }
  lastTimestamp = timestamp;
  requestAnimationFrame(checkFrameRate);
}
```

---

## 9. Real-time 3D / WebGL budget

Live, continuously-rendering WebGL (scroll-camera fly-throughs, raymarchers,
particle fields) is the easiest way to ship a beautiful page that *runs* at
9 fps. These caps are non-negotiable for any Tier B/C/D build; the
`cinematic-doctor` 3D check enforces the starred ones. Lessons paid for in real
device jank — apply them up front, not after a "why is it slow" report.

### Device pixel ratio — the #1 cause of 3D jank ★
A Retina / 4K display has `devicePixelRatio` 2–3. Uncapped, the GPU renders
4–9× the pixels — a raymarcher or fill-heavy scene that's smooth at 1× crawls.
**Always cap, and cap low for live scenes:**

```js
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.0 : 1.5));
// raymarch / fullscreen-shader scenes can go lower — 0.85–1.3; the blur hides it
```

Never `setPixelRatio(devicePixelRatio)` and never a flat cap of `2` on a scene
that animates every frame. The doctor warns on a `≥ 2` cap with no mobile branch.

### Light budget — prefer emissive + IBL over many lights ★
Every real-time `PointLight` / `SpotLight` / `DirectionalLight` adds per-fragment
cost to **every lit mesh**. A hall with one spotlight per painting (8–15 lights)
is a frame-rate cliff. Keep **~2–4 dynamic lights**; get the rest of the look from:
- **`scene.environment`** (an equirectangular HDRI through `PMREMGenerator`) for
  image-based fill + real reflections — one texture, lights nothing per-light;
- **emissive materials / `emissiveMap`** for self-lit art, signs, light strips
  (a painting that glows reads as "lit" for zero light cost);
- a couple of camera-following lights for local warmth.

### Raymarch / shader step budget
Fullscreen raymarchers cost `pixels × steps × map-complexity`. Budget
**≤ 64 march steps desktop / ≤ 40 mobile**, and render at reduced scale (low
pixelRatio) — chrome/cloud blur hides the softness. Sample any environment as a
single `texture2D`, not a per-step loop.

### Particles & fill
- Particle `Points`: a few hundred, not thousands; lower the count on mobile.
  Additive blending is fill-rate-heavy — keep sprites small.
- **MSAA (`antialias`) off** on fog/foliage/fill-heavy scenes — the atmosphere
  hides aliasing and you reclaim a lot of GPU.
- One `WebGLRenderer` per page. Gate the rAF loop on visibility **and**
  on-screen (`IntersectionObserver`), and render a single static frame under
  `prefers-reduced-motion`.

### Demo media — never ship a multi-MB GIF
A scroll-loop GIF is 5–12 MB; the same clip as H.264 MP4 is ~0.3–0.8 MB (10×+
smaller) **and** smoother. Capture demos to `.mp4` and use a lazy
`<video muted loop playsinline preload="none">` that plays only while on-screen;
keep a poster still so the box is never blank. Convert hero stills to WebP.
